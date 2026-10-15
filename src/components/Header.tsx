import { optionLabel } from '../services/websiteConfig';
import { WebsiteText } from '../context/WebsiteContext';
import { useWebsite } from '../context/WebsiteContext';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurriculum } from '../context/CurriculumContext';
import {
  Flame,
  User,
  GraduationCap,
  ShieldCheck,
  Languages,
  LogOut,
  Layers,
  ChevronDown
} from 'lucide-react';

export const Header: React.FC = () => {
  const { config, text: websiteText } = useWebsite();
  const { user, profile, isAdmin, openAuthModal, signOut } = useAuth();
  const { selectedClass, language, toggleLanguage, activeTab, setActiveTab } = useCurriculum();

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="w-full mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Public website navigation" className="flex flex-wrap items-center gap-1 sm:gap-3 rounded-xl bg-slate-50/80 p-1">
          {([
            ['home', language === 'hi' ? 'होम' : 'Home'],
            ['courses', language === 'hi' ? 'कोर्स' : 'Courses'],
            ['contact', language === 'hi' ? 'संपर्क करें' : 'Contact Us']
          ] as const).map(([tab, label]) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${activeTab === tab ? 'bg-[#16439a] text-white' : 'text-slate-700 hover:bg-blue-50'}`}>
              {label}
            </button>
          ))}
        </nav>
        {/* Right Actions: Language Switcher + Student Sign In / Admin Login together */}
        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-amber-50/60 hover:bg-orange-100/70 text-orange-900 transition-colors"
            title={websiteText("Switch Language / भाषा बदलें")}
          >
            <Languages className="w-3.5 h-3.5 text-orange-600" />
            <span>{language === 'en' ? websiteText("हिन्दी") : websiteText("English")}</span>
          </button>

          {/* Authentication Section: Student Sign Up/In & Admin Login placed TOGETHER */}
          {profile ? (
            <div className="flex items-center gap-2">
              {/* Study Streak Badge */}
              <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 text-orange-800 px-2 py-1 rounded-lg text-xs font-bold shadow-xs">
                <Flame className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                <span>{profile.studyStreakDays || 1}<WebsiteText original={"d Streak"} /></span>
              </div>

              {/* User Profile Capsule */}
              <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-orange-50 border border-orange-200">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center font-bold text-xs shadow">
                  {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight pr-1">
                  <div className="font-bold text-stone-800 truncate max-w-[120px]">
                    {profile.displayName}
                  </div>
                  <div className="text-[10px] text-orange-600 font-semibold flex items-center gap-1">
                    {profile.role === 'admin' ? (
                      <span className="text-red-600 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /><WebsiteText original={" Admin"} /></span>
                    ) : (
                      <span><WebsiteText original={"Student ("} />{optionLabel(config.classes,selectedClass,language)})</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title={websiteText("Logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Student Sign In / Sign Up */}
              <button
                onClick={() => openAuthModal('student')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">
                  {language === 'hi' ? websiteText("छात्र प्रवेश") : websiteText("Student Sign In")}
                </span>
              </button>

              {/* Admin Login Button - Placed right alongside */}
              <button
                onClick={() => openAuthModal('admin')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 border border-red-400/40"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
                <span className="whitespace-nowrap">
                  {language === 'hi' ? websiteText("प्रशासक लॉगिन") : websiteText("Admin Login")}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

