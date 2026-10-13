import { activeOptions, optionLabel } from '../services/websiteConfig';
import { WebsiteText } from '../context/WebsiteContext';
import React from 'react';
import { useWebsite } from '../context/WebsiteContext';
import { useCurriculum } from '../context/CurriculumContext';
import { MenuIcon } from './MenuIcon';
import { ContentModuleType, BoardType, ClassGrade, StreamType } from '../types';
import {
  FileText,
  BookmarkCheck,
  Binary,
  GitBranch,
  Layers,
  History,
  Target,
  FileSpreadsheet,
  CheckSquare,
  BookOpen,
  ChevronDown,
  Sparkles,
  Youtube,
  ChevronRight
} from 'lucide-react';

export const LearningSidebar: React.FC = () => {
  const { config, text: websiteText } = useWebsite();
  const {
    activeModule,
    setActiveModule,
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
    language
  } = useCurriculum();

  const modules: {
    id: ContentModuleType;
    label: string;
    hindiLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    tag?: string;
  }[] = [
    {
      id: 'recommended_videos',
      label: 'Recommended Videos',
      hindiLabel: 'अनुशंसित वीडियो',
      icon: Youtube,
      color: 'text-red-600 bg-red-50',
      tag: 'Saarthi Pick'
    },
    {
      id: 'detailed_notes',
      label: 'Detailed Notes',
      hindiLabel: 'विस्तृत नोट्स',
      icon: FileText,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      id: 'revision_notes',
      label: 'Revision Notes',
      hindiLabel: 'रिवीजन नोट्स',
      icon: BookmarkCheck,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      id: 'formulae',
      label: 'Definitions & Formulae',
      hindiLabel: 'परिभाषाएँ एवं सूत्र',
      icon: Binary,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'mindmaps',
      label: 'Mind Maps',
      hindiLabel: 'माइंड मैप्स',
      icon: GitBranch,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      id: 'flashcards',
      label: 'Interactive Flashcards',
      hindiLabel: 'इंटरैक्टिव फ्लैशकार्ड',
      icon: Layers,
      color: 'text-emerald-600 bg-emerald-50',
      tag: 'Interactive'
    },
    {
      id: 'pyqs',
      label: 'Previous Year Questions (PYQ)',
      hindiLabel: 'विगत वर्षों के प्रश्न (PYQs)',
      icon: History,
      color: 'text-red-600 bg-red-50',
      tag: 'Board Imp'
    },
    {
      id: 'cbqs',
      label: 'Competency-Based Questions',
      hindiLabel: 'योग्यता-आधारित प्रश्न (CBQs)',
      icon: Target,
      color: 'text-rose-600 bg-rose-50',
      tag: '50% Pattern'
    },
    {
      id: 'case_studies',
      label: 'Case-Based Studies',
      hindiLabel: 'केस-आधारित अध्ययन',
      icon: FileSpreadsheet,
      color: 'text-teal-600 bg-teal-50'
    },
    {
      id: 'test_yourself',
      label: 'Test Yourself',
      hindiLabel: 'स्वयं का परीक्षण (Live Test)',
      icon: CheckSquare,
      color: 'text-green-600 bg-green-50',
      tag: 'Auto-Graded'
    }
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-orange-200 shadow-sm p-3 flex flex-col gap-3 shrink-0">
      <details open className="group">
        <summary className="cursor-pointer text-xs font-bold text-orange-900 py-2">{websiteText(language === 'hi' ? 'पाठ्यक्रम अनुक्रम' : 'Curriculum Hierarchy')}</summary>
        {/* Curriculum controls wrap on mobile as well as desktop. */}
        <div className="flex w-full flex-col items-stretch gap-2 bg-amber-50/70 border border-orange-200 px-2 py-1 rounded-xl">
          {/* Board Select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium"><WebsiteText original={"Board:"} /></span>
            <select
              aria-label={websiteText("Board")}
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

          <div className="h-px w-full bg-orange-200" />

          {/* Class Select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium"><WebsiteText original={"Class:"} /></span>
            <select
              aria-label={websiteText("Class")}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassGrade)}
              className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
            >
              {activeOptions(config.classes).map(x => <option key={x.id} value={x.id}>{language === 'hi' ? x.hindiLabel || x.label : x.label}</option>)}
            </select>
          </div>

          <div className="h-px w-full bg-orange-200" />

          {/* Stream Select (Only for 11 & 12) */}
          {(selectedClass === 'Class 11' || selectedClass === 'Class 12') && (
            <>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-500 font-medium"><WebsiteText original={"Stream:"} /></span>
                <select
                  aria-label={websiteText("Stream")}
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value as StreamType)}
                  className="bg-transparent font-bold text-orange-900 outline-none cursor-pointer"
                >
                  {activeOptions(config.streams).map(x => <option key={x.id} value={x.id}>{language === 'hi' ? x.hindiLabel || x.label : x.label}</option>)}
                </select>
              </div>
              <div className="h-px w-full bg-orange-200" />
            </>
          )}

        </div>
      {/* Subject Selector */}
      <div>
        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
          {language === 'hi' ? websiteText("विषय चुनें (Subject)") : websiteText("Select Subject")}
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {availableSubjects.map((sub) => {
            const isSelected = selectedSubject?.id === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubject(sub);
                  setSelectedChapter(sub.chapters[0] || null);
                  setSelectedTopic(null);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                    : "bg-stone-50 hover:bg-orange-50 text-stone-800 border border-stone-200/70"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">
                    {language === 'hi' ? sub.hindiName || sub.name : sub.name}
                  </span>
                </div>
                {sub.officialCode && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {sub.officialCode}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapter & Topic Cascading Selector */}
      {selectedSubject && selectedSubject.chapters.length > 0 && (
        <div className="space-y-2 border-t border-orange-100 pt-2.5">
          {/* Chapter Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
              {language === 'hi' ? websiteText("अध्याय (Chapter)") : websiteText("Chapter")}
            </label>
            <select
              aria-label={websiteText("Chapter")}
              value={selectedChapter?.id || ''}
              onChange={(e) => {
                const ch = selectedSubject.chapters.find((c) => c.id === e.target.value);
                setSelectedChapter(ch || null);
                setSelectedTopic(null);
              }}
              className="w-full px-2.5 py-2 text-xs font-semibold bg-amber-50/50 border border-orange-200 rounded-xl text-stone-800 outline-none focus:ring-1 focus:ring-orange-500"
            >
              {selectedSubject.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}><WebsiteText original={"Ch "} />{ch.chapterNumber}: {language === 'hi' ? ch.hindiTitle || ch.title : ch.title}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selector or Full Chapter */}
          {selectedChapter && selectedChapter.topics.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                {language === 'hi' ? websiteText("विषय-वस्तु / टॉपिक") : websiteText("Topic / Scope")}
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                    selectedTopic === null
                      ? "bg-orange-100 text-orange-900 font-bold border border-orange-300"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-700"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>{language === 'hi' ? websiteText("सम्पूर्ण अध्याय (Full Chapter)") : websiteText("Full Chapter Scope")}</span>
                </button>

                {selectedChapter.topics.map((top) => {
                  const isTopSelected = selectedTopic?.id === top.id;
                  return (
                    <button
                      key={top.id}
                      onClick={() => setSelectedTopic(top)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                        isTopSelected
                          ? "bg-orange-100 text-orange-900 font-bold border border-orange-300"
                          : "bg-stone-50 hover:bg-stone-100 text-stone-700"
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 text-orange-500 shrink-0" />
                      <span className="truncate">
                        {language === 'hi' ? top.hindiTitle || top.title : top.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      </details>

      {/* Module Selector (9 Modules strictly organized) */}
      <details open className="border-t border-orange-100 pt-2.5">
        <summary className="cursor-pointer block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
          {language === 'hi' ? websiteText("शिक्षण मॉड्यूल (Learning Modules)") : websiteText("Learning Modules")}
        </summary>
        <div className="space-y-1">
          {config.modules.filter(option => !option.deleted).map(option => { const builtIn = modules.find(mod => mod.id === option.id); return { id: option.id, icon: FileText, color: 'text-orange-600 bg-orange-50', tag: undefined, ...builtIn, menuIcon: option.icon, label: option.label, hindiLabel: option.hindiLabel || option.label }; }).map((mod) => {
            const isModActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                  isModActive
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs font-bold"
                    : "bg-stone-50 hover:bg-orange-50/80 text-stone-700 border border-stone-200/60"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isModActive ? "bg-white/20 text-white" : mod.color
                    }`}
                  >
                    <MenuIcon icon={mod.menuIcon} itemId={mod.id} fallback="file" className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">
                    {websiteText(language === 'hi' ? mod.hindiLabel : mod.label)}
                  </span>
                </div>
                {mod.tag && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isModActive
                        ? "bg-white/30 text-white"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {websiteText(mod.tag)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
};

