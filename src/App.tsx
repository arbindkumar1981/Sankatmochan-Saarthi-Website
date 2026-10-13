import { WebsiteText } from './context/WebsiteContext';
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurriculumProvider, useCurriculum } from './context/CurriculumContext';
import { BabaBanner } from './components/BabaBanner';
import { Header } from './components/Header';
import { VerticalNav } from './components/VerticalNav';
import { LearningSidebar } from './components/LearningSidebar';
import { ContentArea } from './components/ContentArea';
import { MyMaterials } from './components/MyMaterials';
import { ProtectedMaterial } from './components/ProtectedMaterial';
import { YouTubeLearner } from './components/YouTubeLearner';
import { NoticeBoardView } from './components/NoticeBoardView';
import { EvaluationHub } from './components/EvaluationHub';
import { AboutUsView } from './components/AboutUsView';
import { ContactUsView } from './components/ContactUsView';
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
import { WebsiteProvider, useWebsite } from './context/WebsiteContext';
import { AuthModal } from './components/AuthModal';
import { Flame, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { text: websiteText } = useWebsite();
  const { activeTab, language, selectedSubject, selectedChapter, selectedTopic } = useCurriculum();
  const [navigationOpen, setNavigationOpen] = React.useState(false);
  const { isAdmin } = useAuth();
  const { config } = useWebsite();
  const page = config.pages.find(p => `page:${p.id}` === activeTab && !p.deleted);

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30 text-stone-800 font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. Revered Baba Neem Karoli Ji's Photo Banner at the Top of Every Page */}
      <BabaBanner />

      {/* 2. Top Header with Saarthi by Sankatmochan Branding & Authentication */}
      <Header />

      {/* 3. Main Workspace Container with Vertical Navigation */}
      <main className="flex-1 w-full mx-auto p-3 sm:p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <button type="button" onClick={() => setNavigationOpen(open => !open)} aria-expanded={navigationOpen} aria-controls="learning-navigation" className="shrink-0 flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-900 focus-visible:outline-2 focus-visible:outline-orange-500">
            {navigationOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            {language === 'hi' ? (navigationOpen ? 'नेविगेशन छिपाएँ' : 'नेविगेशन खोलें') : (navigationOpen ? 'Hide navigation' : 'Show navigation')}
          </button>
          {activeTab === 'learning' && <p className="min-w-0 flex-1 text-sm text-stone-600 break-words" aria-live="polite">
            {selectedSubject && (language === 'hi' ? selectedSubject.hindiName || selectedSubject.name : selectedSubject.name)}
            {selectedChapter && <> · {language === 'hi' ? selectedChapter.hindiTitle || selectedChapter.title : selectedChapter.title}</>}
            {selectedChapter && <> · {selectedTopic ? (language === 'hi' ? selectedTopic.hindiTitle || selectedTopic.title : selectedTopic.title) : websiteText('Full Chapter Scope')}</>}
          </p>}
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-start min-w-0">
          <aside id="learning-navigation" aria-label={language === 'hi' ? 'अध्ययन नेविगेशन' : 'Learning navigation'} className={`${navigationOpen ? 'flex' : 'hidden'} w-full lg:w-72 shrink-0 flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto`}>
            <VerticalNav />
            <LearningSidebar showModules={activeTab === 'learning'} />
          </aside>
          <div className="flex-1 w-full min-w-0">

            {/* Active Workspace View Routing */}
            {activeTab === 'learning' && (
              <div className="w-full min-w-0">
                {/* Content and Interactive Test Area */}
                <ProtectedMaterial><ContentArea /></ProtectedMaterial>
              </div>
            )}

            {activeTab === 'youtube' && <YouTubeLearner />}

            {activeTab === 'notices' && <NoticeBoardView />}

            {activeTab === 'evaluation' && <EvaluationHub />}
            {activeTab === 'materials' && <MyMaterials />}

            {activeTab === 'about' && <AboutUsView />}

            {activeTab === 'contact' && <ContactUsView />}

            {page && <section className="flex-1 w-full bg-white border rounded-2xl p-6"><h2 className="text-2xl font-bold">{language === 'hi' ? page.hindiTitle || page.title : page.title}</h2><p className="mt-4 whitespace-pre-wrap break-words">{language === 'hi' ? page.hindiBody || page.body : page.body}</p></section>}
            {activeTab === 'admin' && isAdmin && <React.Suspense fallback={<p>Opening Admin panel…</p>}><AdminPanel /></React.Suspense>}
          </div>
        </div>
      </main>

      {/* Auspicious Devotional Footer */}
      <footer className="mt-auto bg-stone-900 text-stone-300 border-t-4 border-orange-500 text-xs py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400 font-bold font-cinzel text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{config.name}</span>
            </div>
            <p className="text-stone-400 text-[11px]">
              {language === 'hi'
                ? websiteText("कक्षा 9वीं से 12वीं तक के विद्यार्थियों के लिए समर्पित डिजिटल गुरुकुल")
                : websiteText("Empowering Classes IX–XII with holistic conceptual mastery, tests & spiritual strength.")}
            </p>
          </div>

          <div className="text-[11px] text-amber-200/80 font-serif italic text-center"><WebsiteText original={"\"मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्। वातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये॥\""} /></div>

          <div className="text-[10px] text-stone-500">
            © {new Date().getFullYear()} {config.name}<WebsiteText original={". All Rights Reserved."} /></div>
        </div>
      </footer>

      {/* Combined Student and Admin Authentication Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WebsiteProvider><CurriculumProvider>
        <MainAppContent />
      </CurriculumProvider></WebsiteProvider>
    </AuthProvider>
  );
}
