import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import {
  extractReadableGeminiError,
  getAudioEntry,
  listHistory,
  synthesizeSpeech,
  transcribeAudio,
} from './geminiVoice.ts';
import { EXPRESSIVE_CUES, GEMINI_VOICES } from '../src/utils/mcpConfig.ts';
import type { GeminiVoiceName } from '../src/types/voice.ts';

export function createVoiceMcpServer(publicBaseUrl: string): McpServer {
  const server = new McpServer({
    name: 'sado-gemini-voice-mcp',
    version: '1.0.0',
  });

  server.registerTool(
    'gemini_text_to_speech',
    {
      title: 'Gemini Text-to-Speech (TTS)',
      description:
        'Convert text or a two-speaker dialogue script into 24kHz WAV speech using Gemini TTS models (gemini-3.8-flash-lite-tts / gemini-3.8-flash-tts). Returns an audio download/playback URL and metadata.',
      inputSchema: {
        text: z
          .string()
          .min(1)
          .describe(
            'Text to synthesize. For dialogue mode, provide lines like "Alex: Hello!\\nSam: Hi there!" and optional cues like <breath>, <laugh>, |yeah|.'
          ),
        voiceName: z
          .enum(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'])
          .optional()
          .describe('Primary Gemini voice name. Defaults to Kore.'),
        mode: z
          .enum(['single', 'dialogue'])
          .optional()
          .describe('Use single for narration or dialogue for two speakers.'),
        secondVoiceName: z
          .enum(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'])
          .optional()
          .describe('Second speaker voice when mode is dialogue. Defaults to Puck.'),
        style: z
          .string()
          .optional()
          .describe(
            'Optional voice delivery style, e.g. "Warm, calm Uzbek narrator" or "Energetic news anchor".'
          ),
      },
    },
    async ({ text, voiceName, mode, secondVoiceName, style }) => {
      try {
        const result = await synthesizeSpeech({
          text,
          voiceName: (voiceName as GeminiVoiceName) || 'Kore',
          mode: mode || 'single',
          secondVoiceName: (secondVoiceName as GeminiVoiceName) || 'Puck',
          style,
          source: 'mcp',
        });

        const absoluteUrl = `${publicBaseUrl.replace(/\/+$/, '')}${result.audioUrl}`;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  id: result.id,
                  model: result.model,
                  voiceName: result.voiceName,
                  secondVoiceName: result.secondVoiceName,
                  durationSec: result.durationSec,
                  byteLength: result.byteLength,
                  mimeType: result.mimeType,
                  audioUrl: absoluteUrl,
                  relativeAudioUrl: result.audioUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = extractReadableGeminiError(error);
        return {
          isError: true,
          content: [{ type: 'text', text: `TTS Error: ${message}` }],
        };
      }
    }
  );

  server.registerTool(
    'gemini_speech_to_text',
    {
      title: 'Gemini Speech-to-Text (STT)',
      description:
        'Transcribe spoken audio into accurate text using Gemini gemini-3.5-transcribe. Provide either base64 audio data or an existing audioId from list_audio_sessions.',
      inputSchema: {
        audioBase64: z
          .string()
          .optional()
          .describe('Base64-encoded audio payload (without data URI prefix or with it).'),
        audioId: z
          .string()
          .optional()
          .describe('Existing audio session ID stored on the SadoMCP server.'),
        mimeType: z
          .string()
          .optional()
          .describe('Audio MIME type such as audio/wav, audio/mp3, audio/webm, audio/ogg.'),
        instruction: z
          .string()
          .optional()
          .describe(
            'Optional transcription instruction, e.g. "Transcribe verbatim in Uzbek and summarize key points."'
          ),
      },
    },
    async ({ audioBase64, audioId, mimeType, instruction }) => {
      try {
        let resolvedBase64 = audioBase64;
        let resolvedMime = mimeType || 'audio/wav';

        if (!resolvedBase64 && audioId) {
          const entry = getAudioEntry(audioId);
          if (!entry) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: `Audio ID topilmadi: ${audioId}`,
                },
              ],
            };
          }
          resolvedBase64 = entry.buffer.toString('base64');
          resolvedMime = entry.mimeType;
        }

        if (!resolvedBase64) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: 'audioBase64 yoki audioId parametrlaridan biri berilishi shart.',
              },
            ],
          };
        }

        const result = await transcribeAudio({
          audioBase64: resolvedBase64,
          mimeType: resolvedMime,
          instruction,
          source: 'mcp',
          existingAudioId: audioId,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  id: result.id,
                  model: result.model,
                  transcript: result.transcript,
                  wordCount: result.wordCount,
                  durationMs: result.durationMs,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Gemini STT xatoligi yuz berdi.';
        return {
          isError: true,
          content: [{ type: 'text', text: `STT Error: ${message}` }],
        };
      }
    }
  );

  server.registerTool(
    'list_gemini_voices',
    {
      title: 'List Gemini Voices & Expressive Cues',
      description:
        'Returns available Gemini TTS voices, supported audio models, and dialogue expressive cues for Claude.',
      inputSchema: {},
    },
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                ttsModels: {
                  standard: 'gemini-3.8-flash-lite-tts',
                  expressiveAndDialogue: 'gemini-3.8-flash-tts',
                },
                sttModel: 'gemini-3.5-transcribe',
                voices: GEMINI_VOICES,
                expressiveCues: EXPRESSIVE_CUES,
                supportedAudioFormats: [
                  'audio/wav',
                  'audio/mp3',
                  'audio/webm',
                  'audio/ogg',
                  'audio/m4a',
                ],
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    'list_audio_sessions',
    {
      title: 'List Audio Sessions',
      description:
        'Returns recent TTS and STT sessions processed by SadoMCP so Claude can inspect or re-transcribe them.',
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe('Maximum number of sessions to return (default 10).'),
      },
    },
    async ({ limit }) => {
      const items = listHistory().slice(0, limit || 10);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: items.length, sessions: items }, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    'gemini-voices-catalog',
    'gemini://voices/catalog',
    {
      title: 'Gemini TTS/STT Capabilities Catalog',
      description: 'Structured catalog of Gemini TTS voices, STT model, and expressive tags.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              voices: GEMINI_VOICES,
              expressiveCues: EXPRESSIVE_CUES,
              models: {
                ttsDefault: 'gemini-3.8-flash-lite-tts',
                ttsDialogue: 'gemini-3.8-flash-tts',
                stt: 'gemini-3.5-transcribe',
              },
            },
            null,
            2
          ),
        },
      ],
    })
  );

  server.registerPrompt(
    'voice-assistant-workflow',
    {
      title: 'Voice Assistant Workflow',
      description:
        'Prompt template guiding Claude to transcribe user voice notes and reply with synthesized Gemini speech.',
      argsSchema: {
        language: z
          .string()
          .optional()
          .describe('Preferred response language, e.g. Uzbek or English.'),
      },
    },
    async ({ language }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are connected to SadoMCP (Gemini TTS & STT). Respond in ${
              language || 'Uzbek'
            }. When given an audioId or audioBase64, call gemini_speech_to_text first, formulate a concise helpful answer, and optionally generate spoken audio using gemini_text_to_speech.`,
          },
        },
      ],
    })
  );

  return server;
}

export function buildStandaloneStdioScript(): string {
  return `#!/usr/bin/env node
/**
 * SadoMCP Standalone Local Stdio MCP Server for Claude Desktop
 * Dependencies: npm install @modelcontextprotocol/sdk @google/genai zod
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as z from "zod";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  apiVersion: "v1beta",
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

const server = new McpServer({
  name: "gemini-voice-mcp-stdio",
  version: "1.0.0",
});

server.registerTool(
  "gemini_text_to_speech",
  {
    description: "Synthesize speech to a local .wav file using Gemini TTS.",
    inputSchema: {
      text: z.string().min(1),
      voiceName: z.enum(["Kore", "Puck", "Charon", "Fenrir", "Zephyr"]).optional(),
      style: z.string().optional(),
    },
  },
  async ({ text, voiceName = "Kore", style }) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [{ text, ...(style ? { speechMetadata: { style } } : {}) }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return { isError: true, content: [{ type: "text", text: "No audio returned from Gemini TTS." }] };
    }
    const outPath = path.join(os.tmpdir(), \`gemini-tts-\${Date.now()}.wav\`);
    fs.writeFileSync(outPath, Buffer.from(base64Audio, "base64"));
    return {
      content: [{ type: "text", text: \`Saved WAV audio (\${voiceName}) to: \${outPath}\` }],
    };
  }
);

server.registerTool(
  "gemini_speech_to_text",
  {
    description: "Transcribe a local audio file using Gemini gemini-3.5-transcribe.",
    inputSchema: {
      filePath: z.string().min(1),
      mimeType: z.string().optional(),
      instruction: z.string().optional(),
    },
  },
  async ({ filePath, mimeType = "audio/wav", instruction }) => {
    const data = fs.readFileSync(filePath).toString("base64");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: instruction || "Transcribe this audio accurately." },
        ],
      },
    });
    return {
      content: [{ type: "text", text: response.text || "" }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
`;
}
