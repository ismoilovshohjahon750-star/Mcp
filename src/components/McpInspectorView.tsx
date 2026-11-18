import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Play } from 'lucide-react';
import type { McpInspectResponse } from '../types/voice';
import type { CopySet } from '../utils/i18n';
import { buildJsonRpcPayload } from '../utils/mcpConfig';

interface McpInspectorViewProps {
  copy: CopySet;
  autoRunToolsList?: boolean;
  onToolExecuted: () => void;
}

interface RpcPreset {
  id: string;
  label: string;
  payload: Record<string, unknown>;
}

const RPC_PRESETS: RpcPreset[] = [
  {
    id: 'initialize',
    label: 'initialize',
    payload: buildJsonRpcPayload(
      'initialize',
      {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'claude-desktop-test', version: '1.0.0' },
      },
      1
    ),
  },
  {
    id: 'tools/list',
    label: 'tools/list',
    payload: buildJsonRpcPayload('tools/list', {}, 2),
  },
  {
    id: 'resources/list',
    label: 'resources/list',
    payload: buildJsonRpcPayload('resources/list', {}, 3),
  },
  {
    id: 'prompts/list',
    label: 'prompts/list',
    payload: buildJsonRpcPayload('prompts/list', {}, 4),
  },
  {
    id: 'list_gemini_voices',
    label: 'call: list_gemini_voices',
    payload: buildJsonRpcPayload(
      'tools/call',
      { name: 'list_gemini_voices', arguments: {} },
      5
    ),
  },
  {
    id: 'gemini_text_to_speech',
    label: 'call: gemini_text_to_speech',
    payload: buildJsonRpcPayload(
      'tools/call',
      {
        name: 'gemini_text_to_speech',
        arguments: {
          text: 'Assalomu alaykum! Claude MCP serveri orqali Gemini TTS muvaffaqiyatli ishlayapti.',
          voiceName: 'Kore',
          mode: 'single',
          style: 'Clear, friendly assistant',
        },
      },
      6
    ),
  },
  {
    id: 'list_audio_sessions',
    label: 'call: list_audio_sessions',
    payload: buildJsonRpcPayload(
      'tools/call',
      { name: 'list_audio_sessions', arguments: { limit: 10 } },
      7
    ),
  },
];

export function McpInspectorView({
  copy,
  autoRunToolsList,
  onToolExecuted,
}: McpInspectorViewProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('tools/list');
  const [requestText, setRequestText] = useState<string>(
    JSON.stringify(RPC_PRESETS[1].payload, null, 2)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspectResult, setInspectResult] =
    useState<McpInspectResponse | null>(null);

  const executeRpc = async (payloadObj: Record<string, unknown>) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/mcp/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'MCP inspect failed');
      }
      setInspectResult(data as McpInspectResponse);
      onToolExecuted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'MCP serverga ulanishda xatolik.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRunToolsList) {
      const toolsPreset = RPC_PRESETS[1];
      setSelectedPreset(toolsPreset.id);
      setRequestText(JSON.stringify(toolsPreset.payload, null, 2));
      executeRpc(toolsPreset.payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunToolsList]);

  const handleSelectPreset = (preset: RpcPreset) => {
    setSelectedPreset(preset.id);
    setRequestText(JSON.stringify(preset.payload, null, 2));
    setError(null);
  };

  const handleSend = () => {
    setError(null);
    try {
      const parsed = JSON.parse(requestText) as Record<string, unknown>;
      executeRpc(parsed);
    } catch {
      setError(copy.inspector.invalidJsonError);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 text-balance">
          {copy.inspector.title}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          {copy.inspector.subtitle}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 text-sm"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">
          {copy.inspector.presetsLabel}
        </span>
        {RPC_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors whitespace-nowrap ${
              selectedPreset === preset.id
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Request Editor */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="mcp-rpc-editor"
              className="font-display text-sm font-semibold text-slate-900"
            >
              {copy.inspector.requestLabel}
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={handleSend}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{copy.inspector.sendingBtn}</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>{copy.inspector.sendBtn}</span>
                </>
              )}
            </button>
          </div>

          <textarea
            id="mcp-rpc-editor"
            rows={14}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            spellCheck={false}
            className="w-full rounded-lg border border-slate-200 bg-slate-950 text-slate-100 p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
        </div>

        {/* Response Viewer */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              {copy.inspector.responseLabel}
            </h2>
            {inspectResult && (
              <span className="text-xs font-mono tabular-nums text-slate-500">
                HTTP {inspectResult.status} · {inspectResult.durationMs} ms
              </span>
            )}
          </div>

          {inspectResult?.generatedAudioUrl && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-xs font-medium text-slate-700">
                {copy.inspector.generatedAudioTitle}
              </p>
              <audio
                controls
                src={inspectResult.generatedAudioUrl}
                className="w-full"
              />
            </div>
          )}

          <pre
            data-testid="mcp-inspector-response"
            className="w-full min-h-[280px] max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 leading-relaxed"
          >
            {inspectResult
              ? JSON.stringify(inspectResult.response, null, 2)
              : '{\n  "info": "Send a JSON-RPC 2.0 request to /mcp"\n}'}
          </pre>
        </div>
      </div>
    </div>
  );
}
