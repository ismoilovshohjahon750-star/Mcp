import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  Loader2,
  Mic,
  Volume2,
} from 'lucide-react';
import type {
  AppLanguage,
  GeminiVoiceName,
  TtsMode,
  TtsResponsePayload,
} from '../types/voice';
import type { CopySet } from '../utils/i18n';
import {
  EXPRESSIVE_CUES,
  GEMINI_VOICES,
  formatBytes,
  formatDuration,
  validateTtsInput,
} from '../utils/mcpConfig';

interface TtsStudioViewProps {
  copy: CopySet;
  language: AppLanguage;
  initialText?: string;
  onSuccess: () => void;
  onSendToStt: (audioId: string, audioUrl: string, summary: string) => void;
}

export function TtsStudioView({
  copy,
  language,
  initialText,
  onSuccess,
  onSendToStt,
}: TtsStudioViewProps) {
  const [mode, setMode] = useState<TtsMode>('single');
  const [voiceName, setVoiceName] = useState<GeminiVoiceName>('Kore');
  const [secondVoiceName, setSecondVoiceName] =
    useState<GeminiVoiceName>('Puck');
  const [style, setStyle] = useState('');
  const [text, setText] = useState(
    initialText ||
      (language === 'uz'
        ? 'Assalomu alaykum! Men Claude AI bilan MCP protokoli orqali ulangan Gemini ovozli yordamchisiman.'
        : 'Hello! I am a Gemini voice assistant connected to Claude AI over the Model Context Protocol.')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TtsResponsePayload | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setText(initialText);
    }
  }, [initialText]);

  // Draw deterministic WAV bar preview on canvas when result updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!result) {
      ctx.fillStyle = '#e2e8f0';
      const bars = 48;
      const gap = width / bars;
      for (let i = 0; i < bars; i++) {
        const barH = 8;
        ctx.fillRect(i * gap + 2, (height - barH) / 2, Math.max(2, gap - 4), barH);
      }
      return;
    }

    try {
      const binary = atob(result.base64Wav);
      const headerOffset = 44;
      const totalSamples = Math.max(1, Math.floor((binary.length - headerOffset) / 2));
      const bars = 56;
      const step = Math.max(1, Math.floor(totalSamples / bars));
      const barWidth = width / bars;

      ctx.fillStyle = '#2563eb';
      for (let i = 0; i < bars; i++) {
        const sampleIndex = headerOffset + i * step * 2;
        let peak = 0;
        for (let j = 0; j < Math.min(step, 120); j++) {
          const idx = sampleIndex + j * 2;
          if (idx + 1 < binary.length) {
            const lo = binary.charCodeAt(idx);
            const hi = binary.charCodeAt(idx + 1);
            let val = (hi << 8) | lo;
            if (val >= 0x8000) val -= 0x10000;
            peak = Math.max(peak, Math.abs(val) / 32768);
          }
        }
        const barH = Math.max(6, Math.round(peak * (height - 12)));
        ctx.fillRect(
          i * barWidth + 1.5,
          (height - barH) / 2,
          Math.max(2, barWidth - 3),
          barH
        );
      }
    } catch {
      // Fallback neutral waveform
      ctx.fillStyle = '#2563eb';
      for (let i = 0; i < 48; i++) {
        const h = 10 + ((i * 17) % 34);
        ctx.fillRect(i * 10, (height - h) / 2, 5, h);
      }
    }
  }, [result]);

  const handleLoadPreset = (presetType: 'uz' | 'dialogue') => {
    setError(null);
    if (presetType === 'dialogue') {
      setMode('dialogue');
      setText(
        language === 'uz'
          ? 'Alex: Assalomu alaykum! <breath> Bugun Claude AI ga MCP orqali Gemini ovozini ulaymiz.\nSam: |yeah| Bu juda zo‘r g‘oya, endi Claude ovozli javoblar bera oladi!'
          : 'Alex: Welcome back! <breath> Today we are connecting Gemini speech to Claude over MCP.\nSam: |yeah| That unlocks seamless voice synthesis and transcription.'
      );
    } else {
      setMode('single');
      setText(
        language === 'uz'
          ? 'Assalomu alaykum! SadoMCP serveri orqali Claude AI endi Gemini yordamida matnlarni jonli o‘zbekcha va xalqaro tillarda ovozga aylantira oladi.'
          : 'Hello! Through SadoMCP, Claude AI can now synthesize natural speech and transcribe recordings via Gemini.'
      );
    }
  };

  const handleInsertCue = (token: string) => {
    setText((prev) => (prev.endsWith(' ') || prev.length === 0 ? `${prev}${token} ` : `${prev} ${token} `));
  };

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateTtsInput({ text, mode, voiceName });
    if (!validation.valid) {
      setError(
        validation.error === 'DIALOGUE_NEEDS_TWO_LINES'
          ? copy.tts.dialogueLinesError
          : copy.tts.emptyTextError
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          voiceName,
          secondVoiceName: mode === 'dialogue' ? secondVoiceName : undefined,
          style: style.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'TTS failed');
      }
      setResult(data as TtsResponsePayload);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Server bilan bog‘lanishda xatolik.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 text-balance">
            {copy.tts.title}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">{copy.tts.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleLoadPreset('uz')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {copy.tts.presetUzbek}
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('dialogue')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {copy.tts.presetDialogue}
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSynthesize}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'single'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.tts.modeSingle}
              </button>
              <button
                type="button"
                onClick={() => setMode('dialogue')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'dialogue'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.tts.modeDialogue}
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500">
              {mode === 'dialogue'
                ? 'gemini-3.8-flash-tts'
                : 'gemini-3.8-flash-lite-tts'}
            </span>
          </div>

          <div
            className={`grid grid-cols-1 ${
              mode === 'dialogue' ? 'sm:grid-cols-2' : ''
            } gap-4`}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="tts-voice-primary"
                className="block text-xs font-medium text-slate-700"
              >
                {copy.tts.voiceLabel}
              </label>
              <select
                id="tts-voice-primary"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value as GeminiVoiceName)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {GEMINI_VOICES.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} — {language === 'uz' ? voice.characterUz : voice.characterEn}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'dialogue' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="tts-voice-secondary"
                  className="block text-xs font-medium text-slate-700"
                >
                  {copy.tts.secondVoiceLabel}
                </label>
                <select
                  id="tts-voice-secondary"
                  value={secondVoiceName}
                  onChange={(e) =>
                    setSecondVoiceName(e.target.value as GeminiVoiceName)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  {GEMINI_VOICES.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} — {language === 'uz' ? voice.characterUz : voice.characterEn}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="tts-style-input"
              className="block text-xs font-medium text-slate-700"
            >
              {copy.tts.styleLabel}
            </label>
            <input
              id="tts-style-input"
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder={copy.tts.stylePlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="tts-script-textarea"
                className="block text-xs font-medium text-slate-700"
              >
                {copy.tts.scriptLabel}
              </label>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {text.length} / 5000
              </span>
            </div>
            <textarea
              id="tts-script-textarea"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === 'dialogue'
                  ? copy.tts.scriptPlaceholderDialogue
                  : copy.tts.scriptPlaceholderSingle
              }
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-500 mr-1">
                {copy.tts.cuesLabel}
              </span>
              {EXPRESSIVE_CUES.map((cue) => (
                <button
                  key={cue.token}
                  type="button"
                  onClick={() => handleInsertCue(cue.token)}
                  title={language === 'uz' ? cue.labelUz : cue.labelEn}
                  className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-mono text-slate-700 transition-colors whitespace-nowrap"
                >
                  {cue.token}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{copy.tts.generatingBtn}</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>{copy.tts.generateBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Output Audio Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-900">
              {copy.tts.outputTitle}
            </h2>
            {result && (
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {formatDuration(result.durationSec)} · {formatBytes(result.byteLength)}
              </span>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <canvas
              ref={canvasRef}
              width={480}
              height={64}
              data-testid="tts-waveform-canvas"
              className="w-full h-16 block"
            />
          </div>

          {result ? (
            <div className="space-y-4">
              <audio
                ref={audioRef}
                controls
                src={`data:audio/wav;base64,${result.base64Wav}`}
                className="w-full"
              />

              <div className="text-xs text-slate-600 space-y-1 font-mono">
                <div>
                  {result.model} · {result.voiceName}
                  {result.secondVoiceName ? ` + ${result.secondVoiceName}` : ''}
                </div>
                <div className="text-slate-500 truncate">
                  MCP audioId: {result.id}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`data:audio/wav;base64,${result.base64Wav}`}
                  download={`sado-${result.voiceName.toLowerCase()}-${result.id.slice(0, 6)}.wav`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{copy.tts.downloadWav}</span>
                </a>

                <button
                  type="button"
                  onClick={() =>
                    onSendToStt(
                      result.id,
                      result.audioUrl,
                      `${result.voiceName} (${formatDuration(result.durationSec)})`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>{copy.tts.sendToStt}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-1.5">
              <p className="text-sm font-medium text-slate-800">
                {copy.tts.outputEmptyTitle}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {copy.tts.outputEmptyDesc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
