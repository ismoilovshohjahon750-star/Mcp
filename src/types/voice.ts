export type GeminiVoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type TtsMode = 'single' | 'dialogue';

export type AppLanguage = 'uz' | 'en';

export type NavSection = 'connect' | 'tts' | 'stt' | 'inspector' | 'history';

export interface VoiceProfile {
  name: GeminiVoiceName;
  pitch: string;
  characterUz: string;
  characterEn: string;
  bestForUz: string;
  bestForEn: string;
}

export interface HistoryItem {
  id: string;
  kind: 'tts' | 'stt';
  source: 'studio' | 'mcp';
  model: string;
  summary: string;
  text: string;
  voiceName?: string;
  secondVoiceName?: string;
  style?: string;
  mimeType: string;
  audioUrl?: string;
  byteLength?: number;
  durationSec?: number;
  wordCount?: number;
  createdAt: string;
}

export interface TtsResponsePayload {
  id: string;
  audioUrl: string;
  base64Wav: string;
  mimeType: string;
  byteLength: number;
  durationSec: number;
  model: string;
  voiceName: string;
  secondVoiceName?: string;
  createdAt: string;
}

export interface SttResponsePayload {
  id: string;
  transcript: string;
  model: string;
  mimeType: string;
  wordCount: number;
  durationMs: number;
  createdAt: string;
}

export interface McpInspectResponse {
  status: number;
  durationMs: number;
  request: Record<string, unknown>;
  response: unknown;
  generatedAudioUrl?: string;
}

export interface McpServerStatusInfo {
  serverName: string;
  version: string;
  protocol: string;
  endpointUrl: string;
  sseUrl: string;
  geminiConfigured: boolean;
  toolsCount: number;
  sessionsCount: number;
}
