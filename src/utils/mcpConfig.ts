import type { GeminiVoiceName, TtsMode, VoiceProfile } from '../types/voice';

export const GEMINI_VOICES: VoiceProfile[] = [
  {
    name: 'Kore',
    pitch: 'Balanced Alto',
    characterUz: 'Ravon, aniq va professional ohang',
    characterEn: 'Clear, balanced, and articulate',
    bestForUz: 'Yangiliklar, maqola o‘qish va Claude ovozli javoblari',
    bestForEn: 'News reading, articles, and Claude voice responses',
  },
  {
    name: 'Puck',
    pitch: 'Bright Tenor',
    characterUz: 'Jonli, quvnoq va tezkor suhbatdosh',
    characterEn: 'Upbeat, energetic, and conversational',
    bestForUz: 'Podkast kirishlari, interaktiv yordamchi',
    bestForEn: 'Podcast intros and interactive assistants',
  },
  {
    name: 'Charon',
    pitch: 'Deep Baritone',
    characterUz: 'Vazmin, chuqur va ishonchli ovoz',
    characterEn: 'Calm, deep, and authoritative',
    bestForUz: 'Hujjatli matnlar, texnik tushuntirishlar',
    bestForEn: 'Documentaries and technical explanations',
  },
  {
    name: 'Fenrir',
    pitch: 'Warm Bass-Baritone',
    characterUz: 'Tabiiy, issiq va hikoyabop ohang',
    characterEn: 'Warm, grounded, and narrative',
    bestForUz: 'Hikoyalar, audio kitoblar va dialoglar',
    bestForEn: 'Storytelling, audiobooks, and dialogues',
  },
  {
    name: 'Zephyr',
    pitch: 'Light Soprano',
    characterUz: 'Yengil, mayin va do‘stona ohang',
    characterEn: 'Light, smooth, and approachable',
    bestForUz: 'Qo‘llab-quvvatlash xizmati va qisqa xabarlar',
    bestForEn: 'Customer guidance and concise alerts',
  },
];

export const EXPRESSIVE_CUES = [
  { token: '<breath>', labelUz: 'Nafas olish', labelEn: 'Breath pause' },
  { token: '<laugh>', labelUz: 'Kulgi', labelEn: 'Laughter' },
  { token: '<gasp>', labelUz: 'Hayrat', labelEn: 'Gasp' },
  { token: '|yeah|', labelUz: 'Tasdiq ("ha")', labelEn: 'Backchannel "yeah"' },
  { token: '|mhm|', labelUz: 'Tinglash ("hm")', labelEn: 'Backchannel "mhm"' },
] as const;

export const ALLOWED_VOICE_NAMES: readonly GeminiVoiceName[] = [
  'Kore',
  'Puck',
  'Charon',
  'Fenrir',
  'Zephyr',
];

export function computeWavDurationSeconds(
  byteLength: number,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): number {
  if (!Number.isFinite(byteLength) || byteLength <= 44) {
    return 0;
  }
  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);
  if (bytesPerSecond <= 0) {
    return 0;
  }
  const pcmBytes = byteLength - 44;
  return Number((pcmBytes / bytesPerSecond).toFixed(2));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const totalSec = Math.round(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface DialogueTurn {
  speaker: string;
  text: string;
}

export interface ParsedDialogue {
  speakerA: string;
  speakerB: string;
  turns: DialogueTurn[];
}

export function parseDialogueScript(
  rawScript: string,
  defaultSpeakerA = 'Alex',
  defaultSpeakerB = 'Sam'
): ParsedDialogue {
  const lines = rawScript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      speakerA: defaultSpeakerA,
      speakerB: defaultSpeakerB,
      turns: [],
    };
  }

  const detectedSpeakers: string[] = [];
  const rawTurns: DialogueTurn[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonMatch = line.match(/^([A-Za-z0-9_' -]{1,24}):\s+(.+)$/);
    if (colonMatch) {
      const speaker = colonMatch[1].trim();
      const text = colonMatch[2].trim();
      if (!detectedSpeakers.includes(speaker) && detectedSpeakers.length < 2) {
        detectedSpeakers.push(speaker);
      }
      const mappedSpeaker =
        detectedSpeakers.includes(speaker)
          ? speaker
          : detectedSpeakers[i % 2] || defaultSpeakerB;
      rawTurns.push({ speaker: mappedSpeaker, text });
    } else {
      const speakerA = detectedSpeakers[0] || defaultSpeakerA;
      const speakerB = detectedSpeakers[1] || defaultSpeakerB;
      if (!detectedSpeakers.includes(speakerA)) detectedSpeakers.push(speakerA);
      if (i > 0 && !detectedSpeakers.includes(speakerB)) {
        detectedSpeakers.push(speakerB);
      }
      const assignedSpeaker = i % 2 === 0 ? speakerA : speakerB;
      rawTurns.push({ speaker: assignedSpeaker, text: line });
    }
  }

  const speakerA = detectedSpeakers[0] || defaultSpeakerA;
  const speakerB =
    detectedSpeakers[1] ||
    (speakerA === defaultSpeakerB ? defaultSpeakerA : defaultSpeakerB);

  return {
    speakerA,
    speakerB,
    turns: rawTurns,
  };
}

export function normalizeBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:3000';
  return trimmed;
}

export function buildClaudeDesktopHttpConfig(
  baseUrl: string,
  serverName = 'gemini-voice-mcp'
): string {
  const normalized = normalizeBaseUrl(baseUrl);
  const config = {
    mcpServers: {
      [serverName]: {
        command: 'npx',
        args: ['-y', 'mcp-remote', `${normalized}/mcp`],
      },
    },
  };
  return JSON.stringify(config, null, 2);
}

export function buildClaudeDesktopStdioConfig(
  scriptPath = '/path/to/gemini-voice-mcp.mjs',
  serverName = 'gemini-voice-mcp'
): string {
  const config = {
    mcpServers: {
      [serverName]: {
        command: 'node',
        args: [scriptPath],
        env: {
          GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
        },
      },
    },
  };
  return JSON.stringify(config, null, 2);
}

export function buildClaudeCodeCliCommand(
  baseUrl: string,
  serverName = 'gemini-voice-mcp'
): string {
  const normalized = normalizeBaseUrl(baseUrl);
  return `claude mcp add --transport http ${serverName} ${normalized}/mcp`;
}

export function buildJsonRpcPayload(
  method: string,
  params?: Record<string, unknown>,
  id: number | string = 1
): {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
} {
  const cleanMethod = method.trim();
  if (!cleanMethod) {
    throw new Error('JSON-RPC method name cannot be empty');
  }
  return params
    ? { jsonrpc: '2.0', id, method: cleanMethod, params }
    : { jsonrpc: '2.0', id, method: cleanMethod };
}

export function validateTtsInput(input: {
  text: string;
  mode: TtsMode;
  voiceName: GeminiVoiceName;
}): { valid: boolean; error?: string } {
  const trimmed = input.text.trim();
  if (!trimmed) {
    return { valid: false, error: 'EMPTY_TEXT' };
  }
  if (trimmed.length > 5000) {
    return { valid: false, error: 'TEXT_TOO_LONG' };
  }
  if (!ALLOWED_VOICE_NAMES.includes(input.voiceName)) {
    return { valid: false, error: 'INVALID_VOICE' };
  }
  if (input.mode === 'dialogue') {
    const parsed = parseDialogueScript(trimmed);
    if (parsed.turns.length < 2) {
      return { valid: false, error: 'DIALOGUE_NEEDS_TWO_LINES' };
    }
  }
  return { valid: true };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
