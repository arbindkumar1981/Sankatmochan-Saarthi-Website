import { optionLabel } from '../services/websiteConfig';
import { WebsiteText } from '../context/WebsiteContext';
import { useWebsite } from '../context/WebsiteContext';
import { activeOptions } from '../services/websiteConfig';
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
  const { config, text: websiteText } = useWebsite();
  const { user, profile, isAdmin, openAuthModal, signOut } = useAuth();
  const {
    setActiveTab,
    selectedBoard,
    setSelectedBoard,
    selectedClass,
    setSelectedClass,
    selectedStream,
    setSelectedStream,
    selectedSubject,
    setSelectedSubject,
    selectedChapter,
    setSelectedChapter,
    selectedTopic,
    setSelectedTopic,
    availableSubjects,
    language,
    toggleLanguage
  } = useCurriculum();

  const handleLogoClick = () => {
    setActiveTab('learning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-white border-b border-orange-200/80 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Official Sankatmochan Saarthi Brand Logo (Clicking opens Home Page) */}
        <SankatmochanLogo
          onClick={handleLogoClick}
          className="w-40 sm:w-52 md:w-60 shrink-0"
        />

        {/* Curriculum controls wrap on mobile as well as desktop. */}
        <div className="flex order-last w-full flex-wrap items-center gap-2 bg-amber-50/70 border border-orange-200 px-2 py-1 rounded-xl">
          {/* Class Select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium"><WebsiteText original={"Class:"} /></span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassGrade)}
              className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
            >
              {activeOptions(config.classes).map(x => <option key={x.id} value={x.id}>{language === 'hi' ? x.hindiLabel || x.label : x.label}</option>)}
            </select>
          </div>

          <div className="h-4 w-px bg-orange-200" />

          {/* Stream Select (Only for 11 & 12) */}
          {(selectedClass === 'Class 11' || selectedClass === 'Class 12') && (
            <>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-500 font-medium"><WebsiteText original={"Stream:"} /></span>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value as StreamType)}
                  className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
                >
                  {activeOptions(config.streams).map(x => <option key={x.id} value={x.id}>{language === 'hi' ? x.hindiLabel || x.label : x.label}</option>)}
                </select>
              </div>
              <div className="h-4 w-px bg-orange-200" />
            </>
          )}

          {/* Board Select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium"><WebsiteText original={"Board:"} /></span>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value as BoardType)}
              className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
            >
              {activeOptions(config.boards).map((b) => (
                <option key={b.id} value={b.id}>
                  {language === 'hi' ? b.hindiLabel || b.label : b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-orange-200" />

          {/* Subject Select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium"><WebsiteText original={"Subject:"} /></span>
            <select
              value={selectedSubject?.id || ''}
              onChange={(e) => {
                const subject = availableSubjects.find(s => s.id === e.target.value) || null;
                setSelectedSubject(subject);
                setSelectedChapter(subject?.chapters[0] || null);
                setSelectedTopic(null);
              }}
              className="max-w-[150px] bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
            >
              <option value="" disabled><WebsiteText original={"Select"} /></option>
              {availableSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-orange-200" />

          {/* Topic Select: chapter/full chapter or an available topic */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium"><WebsiteText original={"Topic:"} /></span>
            <select
              value={selectedTopic?.id || (selectedChapter ? `chapter:${selectedChapter.id}` : '')}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith('chapter:')) {
                  const chapterId = value.slice('chapter:'.length);
                  const chapter = selectedSubject?.chapters.find(ch => ch.id === chapterId) || null;
                  setSelectedChapter(chapter);
                  setSelectedTopic(null);
                  return;
                }
                const match = selectedSubject?.chapters
                  .flatMap(ch => ch.topics.map(topic => ({ ch, topic })))
                  .find(item => item.topic.id === value);
                if (match) {
                  setSelectedChapter(match.ch);
                  setSelectedTopic(match.topic);
                }
              }}
              disabled={!selectedSubject || selectedSubject.chapters.length === 0}
              className="max-w-[180px] bg-transparent font-bold text-orange-900 outline-none cursor-pointer disabled:opacity-50"
            >
              {!selectedSubject?.chapters.length && <option value=""><WebsiteText original={"No topics"} /></option>}
              {selectedSubject?.chapters.map(ch => (
                <React.Fragment key={ch.id}>
                  <option value={`chapter:${ch.id}`}>{ch.title}<WebsiteText original={" — Full Chapter"} /></option>
                  {ch.topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{ch.title} — {topic.title}</option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions: Language Switcher + Student Sign In / Admin Login together */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
