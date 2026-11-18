import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  deleteHistoryItem,
  extractReadableGeminiError,
  getAudioEntry,
  isGeminiConfigured,
  listHistory,
  synthesizeSpeech,
  transcribeAudio,
} from './server/geminiVoice.ts';
import {
  buildStandaloneStdioScript,
  createVoiceMcpServer,
} from './server/mcpFactory.ts';
import type { GeminiVoiceName, TtsMode } from './src/types/voice.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const sseTransports = new Map<string, SSEServerTransport>();

function resolvePublicBaseUrl(req?: express.Request): string {
  const envUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;
  if (envUrl && envUrl !== 'MY_APP_URL') {
    return envUrl.replace(/\/+$/, '');
  }
  if (req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    return `${proto}://${host}`;
  }
  return `http://localhost:${PORT}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Ensure MCP OAuth discovery probes get clean 404 JSON instead of SPA HTML
  app.get('/.well-known/*', (_req, res) => {
    res.status(404).json({ error: 'OAuth not configured for this MCP endpoint' });
  });

  // CORS headers for remote MCP clients (Claude Desktop / mcp-remote / Claude Code)
  app.use('/mcp', (_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Accept, Mcp-Session-Id, Last-Event-ID'
    );
    next();
  });

  app.options('/mcp', (_req, res) => {
    res.status(204).end();
  });

  // Streamable HTTP MCP Endpoint (Primary for Claude AI & modern MCP clients)
  app.post('/mcp', async (req, res) => {
    const baseUrl = resolvePublicBaseUrl(req);
    const mcpServer = createVoiceMcpServer(baseUrl);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      mcpServer.close().catch(() => {});
    });

    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP StreamableHTTP error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal MCP server error',
          },
          id: null,
        });
      }
    }
  });

  app.get('/mcp', (_req, res) => {
    res.status(200).json({
      name: 'sado-gemini-voice-mcp',
      version: '1.0.0',
      transport: 'streamable-http',
      endpoint: '/mcp',
      sseEndpoint: '/mcp/sse',
      tools: [
        'gemini_text_to_speech',
        'gemini_speech_to_text',
        'list_gemini_voices',
        'list_audio_sessions',
      ],
    });
  });

  // Legacy SSE MCP Transport for backward-compatible clients
  app.get('/mcp/sse', async (req, res) => {
    const baseUrl = resolvePublicBaseUrl(req);
    const mcpServer = createVoiceMcpServer(baseUrl);
    const transport = new SSEServerTransport('/mcp/messages', res);
    sseTransports.set(transport.sessionId, transport);

    res.on('close', () => {
      sseTransports.delete(transport.sessionId);
      mcpServer.close().catch(() => {});
    });

    await mcpServer.connect(transport);
  });

  app.post('/mcp/messages', async (req, res) => {
    const sessionId = String(req.query.sessionId || '');
    const transport = sseTransports.get(sessionId);
    if (!transport) {
      res.status(400).json({ error: 'Invalid or expired SSE sessionId' });
      return;
    }
    await transport.handlePostMessage(req, res, req.body);
  });

  // Studio Status API
  app.get('/api/status', (req, res) => {
    const baseUrl = resolvePublicBaseUrl(req);
    res.json({
      serverName: 'sado-gemini-voice-mcp',
      version: '1.0.0',
      protocol: '2025-03-26',
      endpointUrl: `${baseUrl}/mcp`,
      sseUrl: `${baseUrl}/mcp/sse`,
      geminiConfigured: isGeminiConfigured(),
      toolsCount: 4,
      sessionsCount: listHistory().length,
    });
  });

  // Gemini Text-to-Speech API
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, mode, voiceName, secondVoiceName, style, secondStyle } =
        req.body as {
          text?: string;
          mode?: TtsMode;
          voiceName?: GeminiVoiceName;
          secondVoiceName?: GeminiVoiceName;
          style?: string;
          secondStyle?: string;
        };

      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Matn kiritilishi shart.' });
        return;
      }

      const result = await synthesizeSpeech({
        text,
        mode,
        voiceName,
        secondVoiceName,
        style,
        secondStyle,
        source: 'studio',
      });

      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'TTS yaratishda xatolik yuz berdi.';
      res.status(500).json({ error: message });
    }
  });

  // Gemini Speech-to-Text API
  app.post('/api/stt', async (req, res) => {
    try {
      const { audioBase64, audioId, mimeType, instruction } = req.body as {
        audioBase64?: string;
        audioId?: string;
        mimeType?: string;
        instruction?: string;
      };

      let resolvedBase64 = audioBase64;
      let resolvedMime = mimeType || 'audio/wav';

      if (!resolvedBase64 && audioId) {
        const entry = getAudioEntry(audioId);
        if (!entry) {
          res.status(404).json({ error: 'Tanlangan audio topilmadi.' });
          return;
        }
        resolvedBase64 = entry.buffer.toString('base64');
        resolvedMime = entry.mimeType;
      }

      if (!resolvedBase64) {
        res.status(400).json({ error: 'Audio fayl yoki yozuv yuborilishi shart.' });
        return;
      }

      const result = await transcribeAudio({
        audioBase64: resolvedBase64,
        mimeType: resolvedMime,
        instruction,
        source: 'studio',
        existingAudioId: audioId,
      });

      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'STT transkripsiya xatoligi.';
      res.status(500).json({ error: message });
    }
  });

  // Serve generated/stored audio files
  app.get('/api/audio/:id', (req, res) => {
    const entry = getAudioEntry(req.params.id);
    if (!entry) {
      res.status(404).json({ error: 'Audio topilmadi.' });
      return;
    }
    res.setHeader('Content-Type', entry.mimeType || 'audio/wav');
    res.setHeader('Content-Length', entry.buffer.byteLength.toString());
    res.setHeader(
      'Content-Disposition',
      `inline; filename="sado-${req.params.id}.wav"`
    );
    res.send(entry.buffer);
  });

  // Session History API
  app.get('/api/history', (_req, res) => {
    res.json({ items: listHistory() });
  });

  app.delete('/api/history/:id', (req, res) => {
    const removed = deleteHistoryItem(req.params.id);
    if (!removed) {
      res.status(404).json({ error: 'Sessiya topilmadi.' });
      return;
    }
    res.json({ deleted: true });
  });

  // Download standalone Stdio MCP script for local Claude Desktop
  app.get('/api/mcp/download-stdio', (_req, res) => {
    const script = buildStandaloneStdioScript();
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="gemini-voice-mcp.mjs"'
    );
    res.send(script);
  });

  // Live MCP Inspector proxy hitting the real local /mcp StreamableHTTP endpoint
  app.post('/api/mcp/inspect', async (req, res) => {
    const started = Date.now();
    try {
      const rpcPayload = req.body;
      const response = await fetch(`http://127.0.0.1:${PORT}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(rpcPayload),
      });

      const rawText = await response.text();
      let parsed: unknown = rawText;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Keep raw text if non-JSON
      }

      let generatedAudioUrl: string | undefined;
      try {
        const resultText = (
          parsed as { result?: { content?: Array<{ text?: string }> } }
        )?.result?.content?.[0]?.text;
        if (resultText && resultText.startsWith('{')) {
          const inner = JSON.parse(resultText) as { relativeAudioUrl?: string };
          if (inner.relativeAudioUrl) {
            generatedAudioUrl = inner.relativeAudioUrl;
          }
        }
      } catch {
        // ignore optional audio extraction
      }

      res.json({
        status: response.status,
        durationMs: Date.now() - started,
        request: rpcPayload,
        response: parsed,
        generatedAudioUrl,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'MCP inspektor xatoligi.';
      res.status(500).json({ error: message });
    }
  });

  // Vite dev middleware vs Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SadoMCP server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SadoMCP server:', err);
  process.exit(1);
});
