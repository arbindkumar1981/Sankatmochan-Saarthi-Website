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
import { Sparkles, Heart, Shield, Flame } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { text: websiteText } = useWebsite();
  const { activeTab, language } = useCurriculum();
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Vertical Navigation Bar */}
          <VerticalNav />

          {/* Active Workspace View Routing */}
          {activeTab === 'learning' && (
            <div className="flex-1 w-full flex flex-col md:flex-row gap-5 items-start">
              {/* Learning Sidebar (Hierarchy & 9 Modules) */}
              <LearningSidebar />
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
