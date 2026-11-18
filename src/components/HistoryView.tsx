import { useMemo, useRef, useState } from 'react';
import {
  Play,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import type { HistoryItem } from '../types/voice';
import type { CopySet } from '../utils/i18n';
import { formatBytes, formatDuration } from '../utils/mcpConfig';

interface HistoryViewProps {
  copy: CopySet;
  items: HistoryItem[];
  loading: boolean;
  onDelete: (id: string) => void;
  onGoToTts: () => void;
}

type HistoryFilter = 'all' | 'tts' | 'stt' | 'mcp';

export function HistoryView({
  copy,
  items,
  loading,
  onDelete,
  onGoToTts,
}: HistoryViewProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === 'tts' && item.kind !== 'tts') return false;
      if (filter === 'stt' && item.kind !== 'stt') return false;
      if (filter === 'mcp' && item.source !== 'mcp') return false;
      if (!query) return true;
      return (
        item.text.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        (item.voiceName || '').toLowerCase().includes(query)
      );
    });
  }, [items, filter, search]);

  const handleTogglePlay = (item: HistoryItem) => {
    if (!item.audioUrl) return;

    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(item.audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(item.id);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 text-balance">
          {copy.history.title}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          {copy.history.subtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter history items"
          className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
        >
          {(
            [
              { id: 'all', label: copy.history.filterAll },
              { id: 'tts', label: copy.history.filterTts },
              { id: 'stt', label: copy.history.filterStt },
              { id: 'mcp', label: copy.history.filterMcp },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <label htmlFor="history-search" className="sr-only">
            {copy.history.searchPlaceholder}
          </label>
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="history-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={copy.history.searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-6 space-y-3" aria-busy="true">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-10 rounded-lg bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-3">
            <h2 className="font-display text-base font-semibold text-slate-900">
              {copy.history.emptyTitle}
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {copy.history.emptyDesc}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onGoToTts}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                {copy.history.emptyCta}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">{copy.history.colType}</th>
                  <th className="py-3 px-4">{copy.history.colSource}</th>
                  <th className="py-3 px-4">{copy.history.colContent}</th>
                  <th className="py-3 px-4">{copy.history.colModel}</th>
                  <th className="py-3 px-4 text-right">{copy.history.colMetrics}</th>
                  <th className="py-3 px-5 text-right">{copy.history.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => {
                  const isPlaying = playingId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {item.kind.toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {item.source === 'mcp' ? 'Claude MCP' : 'Studio'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 max-w-xs truncate">
                        {item.summary}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {item.model}
                        {item.voiceName ? ` · ${item.voiceName}` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 text-right whitespace-nowrap">
                        {item.durationSec !== undefined
                          ? `${formatDuration(item.durationSec)} · `
                          : ''}
                        {item.byteLength ? formatBytes(item.byteLength) : `${item.wordCount || 0}w`}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {item.audioUrl && (
                            <button
                              type="button"
                              onClick={() => handleTogglePlay(item)}
                              aria-label={`${
                                isPlaying
                                  ? copy.history.stopLabel
                                  : copy.history.playLabel
                              } ${item.summary}`}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              {isPlaying ? (
                                <Square className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            aria-label={`${copy.history.deleteLabel} ${item.summary}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
