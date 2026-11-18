import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AudioLines,
  Check,
  Copy,
  FileAudio,
  Loader2,
  Mic,
  Square,
  Upload,
} from 'lucide-react';
import type {
  AppLanguage,
  HistoryItem,
  SttResponsePayload,
} from '../types/voice';
import type { CopySet } from '../utils/i18n';
import { formatBytes, formatDuration } from '../utils/mcpConfig';

interface SttStudioViewProps {
  copy: CopySet;
  language: AppLanguage;
  historyItems: HistoryItem[];
  preselectedAudio: { id: string; url: string; label: string } | null;
  onSuccess: () => void;
  onSendToTts: (transcript: string) => void;
}

type SttSourceTab = 'record' | 'upload' | 'history';

export function SttStudioView({
  copy,
  language,
  historyItems,
  preselectedAudio,
  onSuccess,
  onSendToTts,
}: SttStudioViewProps) {
  const [sourceTab, setSourceTab] = useState<SttSourceTab>(
    preselectedAudio ? 'history' : 'record'
  );
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);

  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(
    preselectedAudio?.id || null
  );

  const [instruction, setInstruction] = useState(
    language === 'uz'
      ? 'Audioni asl tilida xatosiz va tinish belgilari bilan yozib ber.'
      : 'Transcribe this audio accurately verbatim in its original spoken language.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SttResponsePayload | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (preselectedAudio) {
      setSourceTab('history');
      setSelectedAudioId(preselectedAudio.id);
      setAudioMimeType('audio/wav');
      setAudioPreviewUrl(preselectedAudio.url);
      setSelectedLabel(preselectedAudio.label);
      setAudioBase64(null);
    }
  }, [preselectedAudio]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const audioHistoryOptions = historyItems.filter((item) => item.audioUrl);

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(copy.stt.micPermissionError);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteTimeDomainData(dataArray);
        let maxDev = 0;
        for (let i = 0; i < dataArray.length; i++) {
          maxDev = Math.max(maxDev, Math.abs(dataArray[i] - 128) / 128);
        }
        setMicLevel(Math.min(100, Math.round(maxDev * 160)));
        rafRef.current = window.requestAnimationFrame(updateMeter);
      };
      rafRef.current = window.requestAnimationFrame(updateMeter);

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);
        setAudioPreviewUrl(previewUrl);
        setAudioMimeType(mimeType);
        setSelectedAudioId(null);
        setSelectedLabel(
          `${copy.stt.tabRecord} (${formatBytes(blob.size)})`
        );

        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setAudioBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((t) => t.stop());
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        setMicLevel(0);
      };

      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError(copy.stt.micPermissionError);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError(copy.stt.uploadHint);
      return;
    }

    const mime = file.type || 'audio/wav';
    const previewUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(previewUrl);
    setAudioMimeType(mime);
    setSelectedAudioId(null);
    setSelectedLabel(`${file.name} (${formatBytes(file.size)})`);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAudioBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectHistoryClip = (item: HistoryItem) => {
    setError(null);
    setSelectedAudioId(item.id);
    setAudioBase64(null);
    setAudioMimeType(item.mimeType || 'audio/wav');
    setAudioPreviewUrl(item.audioUrl || null);
    setSelectedLabel(`${item.summary} (${item.voiceName || item.model})`);
  };

  const handleTranscribe = async () => {
    setError(null);
    if (!audioBase64 && !selectedAudioId) {
      setError(copy.stt.noAudioError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioBase64 || undefined,
          audioId: selectedAudioId || undefined,
          mimeType: audioMimeType,
          instruction: instruction.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'STT failed');
      }
      setResult(data as SttResponsePayload);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Transkripsiya xatoligi yuz berdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 text-balance">
          {copy.stt.title}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">{copy.stt.subtitle}</p>
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
        {/* Left: Audio Input + Instruction */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Audio input source"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sourceTab === 'record'}
                onClick={() => setSourceTab('record')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  sourceTab === 'record'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.stt.tabRecord}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sourceTab === 'upload'}
                onClick={() => setSourceTab('upload')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  sourceTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.stt.tabUpload}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sourceTab === 'history'}
                onClick={() => setSourceTab('history')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  sourceTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.stt.tabFromHistory}
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500">
              gemini-3.5-transcribe
            </span>
          </div>

          {sourceTab === 'record' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {recording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>{copy.stt.stopRecord}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>{copy.stt.startRecord}</span>
                    </button>
                  )}
                </div>

                <span className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                  {formatDuration(recordSeconds)}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-[width] duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                {recording && (
                  <p className="text-xs font-medium text-blue-700">
                    {copy.stt.recordingActive}
                  </p>
                )}
              </div>
            </div>
          )}

          {sourceTab === 'upload' && (
            <label
              htmlFor="stt-file-upload"
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-100/60 transition-colors"
            >
              <Upload className="h-6 w-6 text-slate-500 mb-2" />
              <span className="text-sm font-medium text-slate-900">
                {copy.stt.uploadPrompt}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {copy.stt.uploadHint}
              </span>
              <input
                id="stt-file-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          )}

          {sourceTab === 'history' && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {audioHistoryOptions.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 text-center">
                  {copy.stt.historyAudioEmpty}
                </div>
              ) : (
                audioHistoryOptions.map((item) => {
                  const active = selectedAudioId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectHistoryClip(item)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                        active
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {item.summary}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {item.kind.toUpperCase()} · {item.voiceName || item.mimeType}
                        </p>
                      </div>
                      <FileAudio className="h-4 w-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          )}

          {audioPreviewUrl && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                <span className="font-medium text-slate-800 truncate">
                  {selectedLabel || copy.stt.selectedFile}
                </span>
                <span className="font-mono text-slate-500 shrink-0">
                  {audioMimeType}
                </span>
              </div>
              <audio controls src={audioPreviewUrl} className="w-full" />
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="stt-instruction"
              className="block text-xs font-medium text-slate-700"
            >
              {copy.stt.instructionLabel}
            </label>
            <input
              id="stt-instruction"
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={copy.stt.instructionPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  setInstruction(
                    language === 'uz'
                      ? 'Audioni asl tilida xatosiz va tinish belgilari bilan yozib ber.'
                      : 'Transcribe verbatim in the original language with proper punctuation.'
                  )
                }
                className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors whitespace-nowrap"
              >
                {copy.stt.presetVerbatimUz}
              </button>
              <button
                type="button"
                onClick={() =>
                  setInstruction(
                    language === 'uz'
                      ? 'Audioni matnga aylantir va oxirida 2 gaplik qisqa xulosa yoz.'
                      : 'Transcribe the audio and include a 2-sentence summary at the end.'
                  )
                }
                className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors whitespace-nowrap"
              >
                {copy.stt.presetSummary}
              </button>
              <button
                type="button"
                onClick={() =>
                  setInstruction(
                    language === 'uz'
                      ? 'Har bir gapni alohida qatorga ajratib transkripsiya qil.'
                      : 'Transcribe sentence by sentence on separate lines.'
                  )
                }
                className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors whitespace-nowrap"
              >
                {copy.stt.presetTimestamps}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={handleTranscribe}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{copy.stt.transcribingBtn}</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>{copy.stt.transcribeBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Transcript Output */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-900">
              {copy.stt.resultTitle}
            </h2>
            {result && (
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {result.wordCount} words · {result.durationMs} ms
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {result.transcript}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{copy.connect.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copy.stt.copyTranscript}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSendToTts(result.transcript)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <AudioLines className="h-3.5 w-3.5" />
                  <span>{copy.stt.sendToTts}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-1.5">
              <p className="text-sm font-medium text-slate-800">
                {copy.stt.resultEmptyTitle}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {copy.stt.resultEmptyDesc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
