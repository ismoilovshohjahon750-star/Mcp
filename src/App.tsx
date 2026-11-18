import { useCallback, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import type {
  AppLanguage,
  HistoryItem,
  McpServerStatusInfo,
  NavSection,
} from './types/voice';
import { getCopy } from './utils/i18n';
import { Sidebar } from './components/Sidebar';
import { McpConnectView } from './components/McpConnectView';
import { TtsStudioView } from './components/TtsStudioView';
import { SttStudioView } from './components/SttStudioView';
import { McpInspectorView } from './components/McpInspectorView';
import { HistoryView } from './components/HistoryView';

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>('uz');
  const [activeSection, setActiveSection] = useState<NavSection>('connect');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [status, setStatus] = useState<McpServerStatusInfo | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [ttsSeedText, setTtsSeedText] = useState<string | undefined>(undefined);
  const [sttPreselect, setSttPreselect] = useState<{
    id: string;
    url: string;
    label: string;
  } | null>(null);
  const [inspectorAutoRun, setInspectorAutoRun] = useState(false);

  const copy = getCopy(language);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = (await res.json()) as McpServerStatusInfo;
        setStatus(data);
      }
    } catch {
      // Ignore transient polling error
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = (await res.json()) as { items: HistoryItem[] };
        setHistoryItems(data.items || []);
      }
    } catch {
      // Ignore transient error
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, [fetchStatus, fetchHistory]);

  const handleDataUpdated = () => {
    fetchStatus();
    fetchHistory();
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistoryItems((prev) => prev.filter((item) => item.id !== id));
        fetchStatus();
      }
    } catch {
      // Ignore error
    }
  };

  const handleTopAction = () => {
    if (activeSection === 'connect') {
      setInspectorAutoRun(true);
      setActiveSection('inspector');
      return;
    }
    if (activeSection === 'tts') {
      setTtsSeedText(
        language === 'uz'
          ? 'Salom Claude! Gemini API orqali ovozli sintez va transkripsiya sinovdan o‘tmoqda.'
          : 'Hello Claude! Testing Gemini API speech synthesis and transcription over MCP.'
      );
      return;
    }
    if (activeSection === 'stt') {
      const firstAudio = historyItems.find((item) => item.audioUrl);
      if (firstAudio && firstAudio.audioUrl) {
        setSttPreselect({
          id: firstAudio.id,
          url: firstAudio.audioUrl,
          label: firstAudio.summary,
        });
      }
      return;
    }
    if (activeSection === 'inspector') {
      setInspectorAutoRun((prev) => !prev);
      return;
    }
    if (activeSection === 'history') {
      fetchHistory();
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(section) => {
          setInspectorAutoRun(false);
          setActiveSection(section);
        }}
        language={language}
        onChangeLanguage={setLanguage}
        copy={copy}
        status={status}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, 1 primary contextual action on right */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={copy.sidebar.openMenu}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-medium text-slate-500 whitespace-nowrap">
                {copy.brandName}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                /
              </span>
              <span className="font-medium text-slate-900 truncate">
                {copy.nav[activeSection]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTopAction}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {copy.topAction[activeSection]}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {activeSection === 'connect' && (
            <McpConnectView
              copy={copy}
              status={status}
            />
          )}

          {activeSection === 'tts' && (
            <TtsStudioView
              copy={copy}
              language={language}
              initialText={ttsSeedText}
              onSuccess={handleDataUpdated}
              onSendToStt={(audioId, audioUrl, label) => {
                setSttPreselect({ id: audioId, url: audioUrl, label });
                setActiveSection('stt');
              }}
            />
          )}

          {activeSection === 'stt' && (
            <SttStudioView
              copy={copy}
              language={language}
              historyItems={historyItems}
              preselectedAudio={sttPreselect}
              onSuccess={handleDataUpdated}
              onSendToTts={(transcript) => {
                setTtsSeedText(transcript);
                setActiveSection('tts');
              }}
            />
          )}

          {activeSection === 'inspector' && (
            <McpInspectorView
              copy={copy}
              autoRunToolsList={inspectorAutoRun}
              onToolExecuted={handleDataUpdated}
            />
          )}

          {activeSection === 'history' && (
            <HistoryView
              copy={copy}
              items={historyItems}
              loading={historyLoading}
              onDelete={handleDeleteHistory}
              onGoToTts={() => setActiveSection('tts')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
