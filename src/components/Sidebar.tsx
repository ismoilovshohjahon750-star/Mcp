import {
  AudioLines,
  History,
  Mic,
  PlugZap,
  TerminalSquare,
  X,
} from 'lucide-react';
import type {
  AppLanguage,
  McpServerStatusInfo,
  NavSection,
} from '../types/voice';
import type { CopySet } from '../utils/i18n';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  copy: CopySet;
  status: McpServerStatusInfo | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  icon: typeof PlugZap;
}> = [
  { id: 'connect', icon: PlugZap },
  { id: 'tts', icon: AudioLines },
  { id: 'stt', icon: Mic },
  { id: 'inspector', icon: TerminalSquare },
  { id: 'history', icon: History },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  language,
  onChangeLanguage,
  copy,
  status,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-display text-sm font-bold">
              S
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              {copy.brandName}
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label={copy.sidebar.closeMenu}
            className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{copy.nav[item.id]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-4">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>{copy.sidebar.toolsLabel}</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {status ? status.toolsCount : 4}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>{copy.sidebar.sessionsLabel}</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {status ? status.sessionsCount : 0}
            </span>
          </div>
          <div className="pt-1 border-t border-slate-100 text-slate-600">
            {status?.geminiConfigured ? (
              <span className="text-emerald-700 font-medium">
                {copy.status.geminiReady}
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                {copy.status.geminiMissing}
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-500 mb-1.5">
            {copy.sidebar.languageLabel}
          </span>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeLanguage('uz')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                language === 'uz'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              O‘zbekcha
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage('en')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <button
            type="button"
            aria-label={copy.sidebar.closeMenu}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
