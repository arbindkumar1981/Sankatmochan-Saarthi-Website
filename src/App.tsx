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
import { PublicHome, PublicCourses } from './components/PublicPages';
import { ProtectedMaterial } from './components/ProtectedMaterial';
import { YouTubeLearner } from './components/YouTubeLearner';
import { NoticeBoardView } from './components/NoticeBoardView';
import { EvaluationHub } from './components/EvaluationHub';
import { ContactUsView } from './components/ContactUsView';
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
import { WebsiteProvider, useWebsite } from './context/WebsiteContext';
import { AuthModal } from './components/AuthModal';
import { BookOpen, Flame, GraduationCap, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { text: websiteText } = useWebsite();
  const { activeTab, language } = useCurriculum();
  const { isAdmin, user, loading, openAuthModal } = useAuth();
  const { config } = useWebsite();
  const [navigationOpen, setNavigationOpen] = React.useState(true);
  const isPublicPage = ['home', 'courses', 'contact'].includes(activeTab);
  const page = config.pages.find(p => `page:${p.id}` === activeTab && !p.deleted);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] text-slate-800 font-sans selection:bg-blue-200 selection:text-slate-900">
      {/* 1. Revered Baba Neem Karoli Ji's Photo Banner at the Top of Every Page */}
      <BabaBanner />

      {/* 2. Top Header with Saarthi by Sankatmochan Branding & Authentication */}
      <Header />

      {/* 3. Main Workspace Container with Vertical Navigation */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4">
        {!isPublicPage && <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm"><div className="flex items-center gap-2"><span className="rounded-xl bg-blue-100 p-2 text-blue-700"><GraduationCap className="h-5 w-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">Saarthi Learning Hub</p><h1 className="text-sm font-extrabold text-slate-900">{language === 'hi' ? 'मेरा अध्ययन केंद्र' : 'My Learning Workspace'}</h1></div></div><button type="button" aria-expanded={navigationOpen} aria-controls="workspace-navigation" onClick={() => setNavigationOpen(open => !open)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500">{navigationOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          {websiteText(navigationOpen ? (language === 'hi' ? 'नेविगेशन छिपाएँ' : 'Hide navigation') : (language === 'hi' ? 'पाठ्यक्रम और नेविगेशन खोलें' : 'Open curriculum & navigation'))}
        </button></div>}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Vertical Navigation Bar */}
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20" hidden={!navigationOpen || isPublicPage} id="workspace-navigation">
            <details open className="mb-3 rounded-2xl border border-blue-100 bg-white px-3 py-2 shadow-sm"><summary className="cursor-pointer py-2 text-xs font-bold text-blue-900">{websiteText(language === 'hi' ? 'मार्गदर्शन मेनू' : 'Guidance Navigation')}</summary><VerticalNav /></details>
            {activeTab === 'learning' && <LearningSidebar />}
          </div>

          {/* Active Workspace View Routing */}
          {activeTab === 'home' && <PublicHome />}
          {activeTab === 'courses' && <PublicCourses />}
          {!loading && !user && ['learning', 'materials', 'youtube', 'evaluation'].includes(activeTab) && <section className="flex-1 rounded-2xl border border-orange-200 bg-white p-8"><h2 className="text-xl font-bold">{language === 'hi' ? 'विद्यार्थी प्रवेश आवश्यक है' : 'Student sign-in required'}</h2><p className="mt-2 text-stone-600">{language === 'hi' ? 'अध्ययन और प्रगति के लिए साइन इन करें।' : 'Sign in to access learning and progress.'}</p><button type="button" onClick={() => openAuthModal('student')} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-white">{language === 'hi' ? 'छात्र प्रवेश' : 'Student sign in'}</button></section>}
          {activeTab === 'learning' && !!user && (
            <div className="flex-1 min-w-0 w-full flex flex-col gap-3 items-stretch rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:p-5">
              {/* Content and Interactive Test Area */}
              <ProtectedMaterial><ContentArea /></ProtectedMaterial>
            </div>
          )}

          {activeTab === 'youtube' && !!user && <YouTubeLearner />}

          {activeTab === 'notices' && <NoticeBoardView />}

          {activeTab === 'evaluation' && !!user && <EvaluationHub />}
          {activeTab === 'materials' && !!user && <MyMaterials />}

          {activeTab === 'contact' && <ContactUsView />}

          {page && <section className="flex-1 w-full bg-white border rounded-2xl p-6"><h2 className="text-2xl font-bold">{language === 'hi' ? page.hindiTitle || page.title : page.title}</h2><p className="mt-4 whitespace-pre-wrap break-words">{language === 'hi' ? page.hindiBody || page.body : page.body}</p></section>}
          {activeTab === 'admin' && isAdmin && <React.Suspense fallback={<p>Opening Admin panel…</p>}><AdminPanel /></React.Suspense>}
        </div>
      </main>

      {/* Auspicious Devotional Footer */}
      <footer className="mt-auto bg-stone-900 text-stone-300 border-t-4 border-blue-600 text-xs py-8 px-4">
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

