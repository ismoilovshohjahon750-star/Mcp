import { useState } from 'react';
import { ArrowRight, Check, Copy, Download, Terminal } from 'lucide-react';
import type { McpServerStatusInfo } from '../types/voice';
import type { CopySet } from '../utils/i18n';
import {
  buildClaudeCodeCliCommand,
  buildClaudeDesktopHttpConfig,
  buildClaudeDesktopStdioConfig,
} from '../utils/mcpConfig';

interface McpConnectViewProps {
  copy: CopySet;
  status: McpServerStatusInfo | null;
}

type ConfigTab = 'desktop' | 'cli' | 'stdio';

export function McpConnectView({
  copy,
  status,
}: McpConnectViewProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('desktop');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const originUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';

  const baseUrl = status?.endpointUrl
    ? status.endpointUrl.replace(/\/mcp$/, '')
    : originUrl;

  const liveMcpEndpoint = `${baseUrl}/mcp`;
  const desktopConfigJson = buildClaudeDesktopHttpConfig(baseUrl);
  const claudeCodeCmd = buildClaudeCodeCliCommand(baseUrl);
  const stdioConfigJson = buildClaudeDesktopStdioConfig();

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const tools = [
    {
      name: 'gemini_text_to_speech',
      model: 'gemini-3.8-flash-lite-tts / 3.8-flash-tts',
      purpose: copy.connect.toolDescriptions.gemini_text_to_speech,
    },
    {
      name: 'gemini_speech_to_text',
      model: 'gemini-3.5-transcribe',
      purpose: copy.connect.toolDescriptions.gemini_speech_to_text,
    },
    {
      name: 'list_gemini_voices',
      model: 'Catalog',
      purpose: copy.connect.toolDescriptions.list_gemini_voices,
    },
    {
      name: 'list_audio_sessions',
      model: 'Session Store',
      purpose: copy.connect.toolDescriptions.list_audio_sessions,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 max-w-3xl text-balance">
          {copy.connect.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          {copy.connect.subtitle}
        </p>
      </section>

      {/* Architecture 3-Step Flow */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>MCP Client</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            {copy.connect.step1Title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {copy.connect.step1Desc}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>JSON-RPC 2.0</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            {copy.connect.step2Title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {copy.connect.step2Desc}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>@google/genai</span>
            <Terminal className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            {copy.connect.step3Title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {copy.connect.step3Desc}
          </p>
        </div>
      </section>

      {/* Live Endpoint & Claude Config Builder */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              {copy.connect.endpointTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {copy.connect.endpointHint}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <code className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-mono text-slate-800 max-w-[260px] sm:max-w-xs truncate">
              {liveMcpEndpoint}
            </code>
            <button
              type="button"
              onClick={() => handleCopy('endpoint', liveMcpEndpoint)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedId === 'endpoint' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{copy.connect.copiedBtn}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copy.connect.copyBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Claude MCP connection method"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'desktop'}
                onClick={() => setActiveTab('desktop')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'desktop'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.connect.tabDesktopHttp}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cli'}
                onClick={() => setActiveTab('cli')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'cli'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.connect.tabClaudeCode}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'stdio'}
                onClick={() => setActiveTab('stdio')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'stdio'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.connect.tabStdio}
              </button>
            </div>
          </div>

          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {copy.connect.desktopHttpDesc}
              </p>
              <div className="relative rounded-lg bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleCopy('desktop-json', desktopConfigJson)}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors whitespace-nowrap"
                >
                  {copiedId === 'desktop-json' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{copy.connect.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copy.connect.copyBtn}</span>
                    </>
                  )}
                </button>
                <pre className="pr-24 leading-relaxed">{desktopConfigJson}</pre>
              </div>
              <p className="text-xs text-slate-500 font-mono break-all">
                {copy.connect.configPathHint}
              </p>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {copy.connect.claudeCodeDesc}
              </p>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto">
                <code className="whitespace-nowrap">{claudeCodeCmd}</code>
                <button
                  type="button"
                  onClick={() => handleCopy('cli-cmd', claudeCodeCmd)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedId === 'cli-cmd' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{copy.connect.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copy.connect.copyBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stdio' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-slate-600 max-w-2xl">
                  {copy.connect.stdioDesc}
                </p>
                <a
                  href="/api/mcp/download-stdio"
                  download="gemini-voice-mcp.mjs"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{copy.connect.downloadStdioBtn}</span>
                </a>
              </div>
              <div className="relative rounded-lg bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleCopy('stdio-json', stdioConfigJson)}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors whitespace-nowrap"
                >
                  {copiedId === 'stdio-json' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{copy.connect.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copy.connect.copyBtn}</span>
                    </>
                  )}
                </button>
                <pre className="pr-24 leading-relaxed">{stdioConfigJson}</pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MCP Tools Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">
            {copy.connect.toolsTableTitle}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-6">{copy.connect.colTool}</th>
                <th className="py-3 px-4">{copy.connect.colModel}</th>
                <th className="py-3 px-6">{copy.connect.colPurpose}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tools.map((tool) => (
                <tr key={tool.name} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                    {tool.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {tool.model}
                  </td>
                  <td className="py-3.5 px-6 text-sm text-slate-700">
                    {tool.purpose}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
