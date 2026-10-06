import { WebsiteText } from '../context/WebsiteContext';
import React from 'react';
import { useWebsite } from '../context/WebsiteContext';
import { useCurriculum, MainTabType } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import { managedNavigation } from '../services/websiteConfig';
import { MenuIcon } from './MenuIcon';
import {
  BookOpen,
  Youtube,
  BellRing,
  Award,
  Info,
  PhoneCall,
  ShieldCheck,
  Flame,
  ChevronRight
} from 'lucide-react';

export const VerticalNav: React.FC = () => {
  const { text: websiteText } = useWebsite();
  const { activeTab, setActiveTab, language, testResults } = useCurriculum();
  const { isAdmin } = useAuth();
  const { config } = useWebsite();

  const navItems = [
    { id: 'materials' as MainTabType, label: 'My Dashboard — Saved Materials', sub: '', icon: BookOpen, accent: 'from-orange-500 to-amber-500' },
    {
      id: 'learning' as MainTabType,
      label: language === 'hi' ? 'अध्ययन कक्ष (Curriculum)' : 'Learning Hub',
      sub: language === 'hi' ? 'नोट्स, सूत्र, प्रश्न बैंक' : 'Notes, Formulas, PYQs',
      icon: BookOpen,
      accent: 'from-orange-500 to-amber-500'
    },
    {
      id: 'youtube' as MainTabType,
      label: language === 'hi' ? 'यूट्यूब से सीखें' : 'Learn with YouTube',
      sub: language === 'hi' ? 'वीडियो व्याख्यान एवं नोट्स' : 'Curated Video Lectures',
      icon: Youtube,
      accent: 'from-red-500 to-rose-600'
    },
    {
      id: 'notices' as MainTabType,
      label: language === 'hi' ? 'प्रेरणादायक सूचना पट्ट' : 'Notice Board',
      sub: language === 'hi' ? 'शक्तियाँ व सुधार क्षेत्र' : 'Strengths & Growth Areas',
      icon: BellRing,
      accent: 'from-amber-500 to-yellow-600',
      badge: 'Daily'
    },
    {
      id: 'evaluation' as MainTabType,
      label: language === 'hi' ? 'मूल्यांकन एवं रिपोर्ट' : 'Evaluation Hub',
      sub: language === 'hi' ? 'टेस्ट परिणाम व मिस्टेक बुक' : 'Report Cards & Mistakes',
      icon: Award,
      accent: 'from-emerald-500 to-teal-600',
      count: testResults.length > 0 ? testResults.length : undefined
    },
    {
      id: 'about' as MainTabType,
      label: language === 'hi' ? 'हमारे विषय में' : 'About Us',
      sub: language === 'hi' ? 'संकटमोचन विद्यापीठ प्रेरणा' : 'Spiritual & Academic Vision',
      icon: Info,
      accent: 'from-orange-600 to-amber-700'
    },
    {
      id: 'contact' as MainTabType,
      label: language === 'hi' ? 'संपर्क करें' : 'Contact Us',
      sub: language === 'hi' ? 'पूछताछ व मार्गदर्शन' : 'Help & Academic Support',
      icon: PhoneCall,
      accent: 'from-stone-600 to-stone-800'
    }
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin' as MainTabType,
      label: language === 'hi' ? 'प्रशासक नियंत्रण कक्ष' : 'Admin Control Panel',
      sub: language === 'hi' ? 'विद्यार्थी, सामग्री व टेस्ट' : 'Curriculum, Content & Enquiries',
      icon: ShieldCheck,
      accent: 'from-red-600 to-amber-700',
      badge: 'Master'
    });
  }

  return (
    <nav className="w-full lg:w-64 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-2.5 sm:p-3 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible shrink-0 scrollbar-none">
      <div className="hidden lg:block px-3 py-2 border-b border-orange-100 mb-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-900/70 font-cinzel">
          {language === 'hi' ? websiteText("मार्गदर्शन मेनू") : websiteText("Guidance Navigation")}
        </span>
      </div>

      {[...managedNavigation(config.navigation).filter(option => !option.deleted && (option.id !== 'admin' || isAdmin)).flatMap(option => { const item = navItems.find(x => x.id === option.id); return item ? [{ ...item, menuIcon: option.icon, label: language === 'hi' ? option.hindiLabel || option.label : option.label, sub: language === 'hi' ? option.hindiSubtitle ?? option.subtitle ?? item.sub : option.subtitle ?? item.sub }] : []; }), ...config.pages.filter(p => !p.deleted).map(p => ({ id: `page:${p.id}` as MainTabType, label: language === 'hi' ? p.hindiTitle || p.title : p.title, sub: '', menuIcon: p.icon, accent: 'from-orange-600 to-amber-700', badge: undefined, count: undefined }))].map((item) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative whitespace-nowrap lg:whitespace-normal group ${
              isActive
                ? "bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-orange-500/5 text-orange-900 border border-orange-300 font-bold shadow-xs"
                : "text-stone-700 hover:bg-orange-50/70 hover:text-orange-900 font-medium"
            }`}
          >
            {/* Icon Bubble */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                isActive
                  ? `bg-gradient-to-br ${item.accent} text-white`
                  : "bg-amber-100/70 text-orange-700"
              }`}
            >
              <MenuIcon icon={item.menuIcon} itemId={item.id} className="w-4 h-4" />
            </div>

            {/* Labels */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs sm:text-sm font-semibold truncate leading-tight">
                  {websiteText(item.label)}
                </span>
                {item.badge && (
                  <span className="hidden lg:inline text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                    {websiteText(item.badge)}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                    {item.count}
                  </span>
                )}
              </div>
              <p className="hidden lg:block text-[11px] text-stone-500 truncate font-normal mt-0.5">
                {websiteText(item.sub)}
              </p>
            </div>

            {isActive && (
              <ChevronRight className="hidden lg:block w-4 h-4 text-orange-600 shrink-0" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
