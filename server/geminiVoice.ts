import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'node:crypto';
import type {
  GeminiVoiceName,
  HistoryItem,
  SttResponsePayload,
  TtsMode,
  TtsResponsePayload,
} from '../src/types/voice.ts';
import {
  computeWavDurationSeconds,
  countWords,
  parseDialogueScript,
} from '../src/utils/mcpConfig.ts';

interface StoredAudio {
  buffer: Buffer;
  mimeType: string;
  createdAt: string;
}

const audioStore = new Map<string, StoredAudio>();
const historyStore: HistoryItem[] = [];
const MAX_HISTORY_ITEMS = 50;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY sozlanmagan. Iltimos, AI Studio Secrets panelida GEMINI_API_KEY ni kiriting.'
    );
  }

  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function extractReadableGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // not JSON
  }
  return raw;
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY');
}

function addHistoryItem(item: HistoryItem): void {
  historyStore.unshift(item);
  if (historyStore.length > MAX_HISTORY_ITEMS) {
    const removed = historyStore.splice(MAX_HISTORY_ITEMS);
    for (const oldItem of removed) {
      audioStore.delete(oldItem.id);
    }
  }
}

export function listHistory(): HistoryItem[] {
  return [...historyStore];
}

export function getHistoryItem(id: string): HistoryItem | undefined {
  return historyStore.find((item) => item.id === id);
}

export function deleteHistoryItem(id: string): boolean {
  const index = historyStore.findIndex((item) => item.id === id);
  if (index === -1) return false;
  historyStore.splice(index, 1);
  audioStore.delete(id);
  return true;
}

export function getAudioEntry(id: string): StoredAudio | undefined {
  return audioStore.get(id);
}

export function saveAudioEntry(
  buffer: Buffer,
  mimeType: string
): { id: string; audioUrl: string } {
  const id = randomUUID();
  audioStore.set(id, {
    buffer,
    mimeType,
    createdAt: new Date().toISOString(),
  });
  return { id, audioUrl: `/api/audio/${id}` };
}

export interface SynthesizeSpeechInput {
  text: string;
  mode?: TtsMode;
  voiceName?: GeminiVoiceName;
  secondVoiceName?: GeminiVoiceName;
  style?: string;
  secondStyle?: string;
  source?: 'studio' | 'mcp';
}

export async function synthesizeSpeech(
  input: SynthesizeSpeechInput
): Promise<TtsResponsePayload> {
  const text = input.text.trim();
  if (!text) {
    throw new Error('Matn bo‘sh bo‘lishi mumkin emas.');
  }

  const mode: TtsMode = input.mode === 'dialogue' ? 'dialogue' : 'single';
  const voiceName: GeminiVoiceName = input.voiceName || 'Kore';
  const secondVoiceName: GeminiVoiceName = input.secondVoiceName || 'Puck';
  const source = input.source || 'studio';
  const ai = getAiClient();

  let model = 'gemini-3.8-flash-lite-tts';
  let response;

  if (mode === 'dialogue') {
    model = 'gemini-3.8-flash-tts';
    const parsed = parseDialogueScript(text);
    if (parsed.turns.length < 2) {
      throw new Error(
        'Dialog rejimi uchun kamida 2 qator matn kiriting (masalan: "Alex: Salom!\\nSam: Alik!").'
      );
    }

    const parts = parsed.turns.map((turn) => {
      const turnStyle =
        turn.speaker === parsed.speakerA
          ? input.style?.trim() || 'Natural, engaging conversational host'
          : input.secondStyle?.trim() || 'Curious, articulate co-host';
      return {
        text: `${turn.speaker}: ${turn.text}`,
        speechMetadata: {
          speaker: turn.speaker,
          style: turnStyle,
        },
      };
    });

    response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: parsed.speakerA,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
              {
                speaker: parsed.speakerB,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: secondVoiceName },
                },
              },
            ],
          },
        },
      },
    });
  } else {
    const hasExpressiveTags = /<(breath|laugh|gasp)>|\|(yeah|mhm)\|/i.test(text);
    model = hasExpressiveTags ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';

    response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              ...(input.style?.trim()
                ? { speechMetadata: { style: input.style.trim() } }
                : {}),
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
  }

  const base64Wav =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Wav) {
    throw new Error(
      'Gemini TTS audio qaytarmadi. Matn yoki ovoz sozlamalarini tekshirib qayta urinib ko‘ring.'
    );
  }

  const wavBuffer = Buffer.from(base64Wav, 'base64');
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const durationSec = computeWavDurationSeconds(wavBuffer.byteLength);
  const audioUrl = `/api/audio/${id}`;

  audioStore.set(id, {
    buffer: wavBuffer,
    mimeType: 'audio/wav',
    createdAt,
  });

  addHistoryItem({
    id,
    kind: 'tts',
    source,
    model,
    summary: text.length > 72 ? `${text.slice(0, 72)}...` : text,
    text,
    voiceName,
    secondVoiceName: mode === 'dialogue' ? secondVoiceName : undefined,
    style: input.style?.trim() || undefined,
    mimeType: 'audio/wav',
    audioUrl,
    byteLength: wavBuffer.byteLength,
    durationSec,
    wordCount: countWords(text),
    createdAt,
  });

  return {
    id,
    audioUrl,
    base64Wav,
    mimeType: 'audio/wav',
    byteLength: wavBuffer.byteLength,
    durationSec,
    model,
    voiceName,
    secondVoiceName: mode === 'dialogue' ? secondVoiceName : undefined,
    createdAt,
  };
}

export interface TranscribeAudioInput {
  audioBase64: string;
  mimeType: string;
  instruction?: string;
  source?: 'studio' | 'mcp';
  existingAudioId?: string;
}

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<SttResponsePayload> {
  const startTime = Date.now();
  const ai = getAiClient();
  const model = 'gemini-3.5-transcribe';
  const cleanBase64 = input.audioBase64.replace(/^data:[^;]+;base64,/, '').trim();

  if (!cleanBase64) {
    throw new Error('Audio ma’lumotlari bo‘sh.');
  }

  const mimeType = input.mimeType || 'audio/wav';
  const userHint = input.instruction?.trim();
  const promptText = userHint
    ? `Transcribe this audio. ${userHint}`
    : 'Transcribe this audio.';

  const audioPart = {
    inlineData: {
      mimeType,
      data: cleanBase64,
    },
  };

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [audioPart, { text: promptText }] },
  });

  const partsText =
    response.candidates?.[0]?.content?.parts
      ?.map((p) => ('text' in p && typeof p.text === 'string' ? p.text : ''))
      .join('') || '';
  const transcript = (response.text || partsText).trim();
  if (!transcript) {
    const finishReason = response.candidates?.[0]?.finishReason;
    throw new Error(
      `Gemini STT bo‘sh matn qaytardi${finishReason ? ` (${finishReason})` : ''}.`
    );
  }

  const durationMs = Date.now() - startTime;
  const createdAt = new Date().toISOString();
  const wordCount = countWords(transcript);
  const buffer = Buffer.from(cleanBase64, 'base64');

  const audioId = input.existingAudioId || randomUUID();
  if (!audioStore.has(audioId)) {
    audioStore.set(audioId, {
      buffer,
      mimeType,
      createdAt,
    });
  }

  const historyId = randomUUID();
  addHistoryItem({
    id: historyId,
    kind: 'stt',
    source: input.source || 'studio',
    model,
    summary: transcript.length > 72 ? `${transcript.slice(0, 72)}...` : transcript,
    text: transcript,
    mimeType,
    audioUrl: `/api/audio/${audioId}`,
    byteLength: buffer.byteLength,
    wordCount,
    createdAt,
  });

  return {
    id: historyId,
    transcript,
    model,
    mimeType,
    wordCount,
    durationMs,
    createdAt,
  };
}
