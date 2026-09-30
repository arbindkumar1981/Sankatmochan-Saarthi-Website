import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurriculum } from '../context/CurriculumContext';
import { SUPPORTED_BOARDS } from '../data/defaultCurriculum';
import { BoardType, ClassGrade, StreamType } from '../types';
import { SankatmochanLogo } from './SankatmochanLogo';
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
  const { user, profile, isAdmin, openAuthModal, signOut } = useAuth();
  const {
    setActiveTab,
    selectedBoard,
    setSelectedBoard,
    selectedClass,
    setSelectedClass,
    selectedStream,
    setSelectedStream,
    language,
    toggleLanguage
  } = useCurriculum();

  const handleLogoClick = () => {
    setActiveTab('learning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-white border-b border-orange-200/80 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Official Sankatmochan Saarthi Brand Logo (Clicking opens Home Page) */}
        <SankatmochanLogo
          onClick={handleLogoClick}
          className="h-12 sm:h-14 md:h-16 shrink-0"
        />

        {/* Board & Class Quick Controls (Desktop / Tablet) */}
        <div className="hidden lg:flex items-center gap-2 bg-amber-50/70 border border-orange-200 px-2 py-1 rounded-xl">
          {/* Class Select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassGrade)}
              className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
            >
              <option value="Class 9">Class IX</option>
              <option value="Class 10">Class X</option>
              <option value="Class 11">Class XI</option>
              <option value="Class 12">Class XII</option>
            </select>
          </div>

          <div className="h-4 w-px bg-orange-200" />

          {/* Stream Select (Only for 11 & 12) */}
          {(selectedClass === 'Class 11' || selectedClass === 'Class 12') && (
            <>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-500 font-medium">Stream:</span>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value as StreamType)}
                  className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
                >
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>
              <div className="h-4 w-px bg-orange-200" />
            </>
          )}

          {/* Board Select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium">Board:</span>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value as BoardType)}
              className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
            >
              {SUPPORTED_BOARDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions: Language Switcher + Student Sign In / Admin Login together */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-amber-50/60 hover:bg-orange-100/70 text-orange-900 transition-colors"
            title="Switch Language / भाषा बदलें"
          >
            <Languages className="w-3.5 h-3.5 text-orange-600" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Authentication Section: Student Sign Up/In & Admin Login placed TOGETHER */}
          {profile ? (
            <div className="flex items-center gap-2">
              {/* Study Streak Badge */}
              <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 text-orange-800 px-2 py-1 rounded-lg text-xs font-bold shadow-xs">
                <Flame className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                <span>{profile.studyStreakDays || 1}d Streak</span>
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
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span>Student ({selectedClass})</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Logout"
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
                  {language === 'hi' ? 'छात्र प्रवेश' : 'Student Sign In'}
                </span>
              </button>

              {/* Admin Login Button - Placed right alongside */}
              <button
                onClick={() => openAuthModal('admin')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 border border-red-400/40"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
                <span className="whitespace-nowrap">
                  {language === 'hi' ? 'प्रशासक लॉगिन' : 'Admin Login'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
