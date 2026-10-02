import React from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { ContentModuleType, SubjectMeta, ChapterMeta, TopicMeta } from '../types';
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
  const {
    activeModule,
    setActiveModule,
    selectedBoard,
    selectedClass,
    selectedStream,
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
      id: 'recommended_videos',
      label: 'Recommended Videos',
      hindiLabel: 'अनुशंसित वीडियो',
      icon: Youtube,
      color: 'text-red-600 bg-red-50',
      tag: 'Saarthi Pick'
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
    <div className="w-full md:w-80 bg-white rounded-2xl border border-orange-200 shadow-sm p-3 flex flex-col gap-3 shrink-0">
      {/* Hierarchy Path Badge: Board → Class → Stream */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-orange-200/90 rounded-xl p-2.5">
        <div className="text-[10px] font-bold text-orange-950 uppercase tracking-wide flex items-center gap-1 font-cinzel">
          <Sparkles className="w-3 h-3 text-orange-600" />
          <span>{language === 'hi' ? 'पाठ्यक्रम अनुक्रम' : 'Curriculum Hierarchy'}</span>
        </div>
        <div className="text-xs font-bold text-stone-800 mt-1 flex flex-wrap items-center gap-1">
          <span className="bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-800">
            {selectedBoard}
          </span>
          <span className="text-orange-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-800">
            {selectedClass}
          </span>
          {(selectedClass === 'Class 11' || selectedClass === 'Class 12') && (
            <>
              <span className="text-orange-400">→</span>
              <span className="bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-800">
                {selectedStream}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Subject Selector */}
      <div>
        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
          {language === 'hi' ? 'विषय चुनें (Subject)' : 'Select Subject'}
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
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                    : 'bg-stone-50 hover:bg-orange-50 text-stone-800 border border-stone-200/70'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">
                    {language === 'hi' ? sub.hindiName : sub.name}
                  </span>
                </div>
                {sub.officialCode && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
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
              {language === 'hi' ? 'अध्याय (Chapter)' : 'Chapter'}
            </label>
            <select
              value={selectedChapter?.id || ''}
              onChange={(e) => {
                const ch = selectedSubject.chapters.find((c) => c.id === e.target.value);
                setSelectedChapter(ch || null);
                setSelectedTopic(null);
              }}
              className="w-full px-2.5 py-2 text-xs font-semibold bg-amber-50/50 border border-orange-200 rounded-xl text-stone-800 outline-none focus:ring-1 focus:ring-orange-500"
            >
              {selectedSubject.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Ch {ch.chapterNumber}: {language === 'hi' ? ch.hindiTitle : ch.title}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selector or Full Chapter */}
          {selectedChapter && selectedChapter.topics.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                {language === 'hi' ? 'विषय-वस्तु / टॉपिक' : 'Topic / Scope'}
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                    selectedTopic === null
                      ? 'bg-orange-100 text-orange-900 font-bold border border-orange-300'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>{language === 'hi' ? 'सम्पूर्ण अध्याय (Full Chapter)' : 'Full Chapter Scope'}</span>
                </button>

                {selectedChapter.topics.map((top) => {
                  const isTopSelected = selectedTopic?.id === top.id;
                  return (
                    <button
                      key={top.id}
                      onClick={() => setSelectedTopic(top)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                        isTopSelected
                          ? 'bg-orange-100 text-orange-900 font-bold border border-orange-300'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 text-orange-500 shrink-0" />
                      <span className="truncate">
                        {language === 'hi' ? top.hindiTitle : top.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module Selector (9 Modules strictly organized) */}
      <div className="border-t border-orange-100 pt-2.5">
        <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
          {language === 'hi' ? 'शिक्षण मॉड्यूल (Learning Modules)' : 'Learning Modules'}
        </label>
        <div className="space-y-1">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isModActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                  isModActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs font-bold'
                    : 'bg-stone-50 hover:bg-orange-50/80 text-stone-700 border border-stone-200/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isModActive ? 'bg-white/20 text-white' : mod.color
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">
                    {language === 'hi' ? mod.hindiLabel : mod.label}
                  </span>
                </div>
                {mod.tag && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isModActive
                        ? 'bg-white/30 text-white'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {mod.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
