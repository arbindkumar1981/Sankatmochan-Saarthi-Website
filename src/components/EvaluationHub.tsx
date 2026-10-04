import { useWebsite } from '../context/WebsiteContext';
import { WebsiteText } from '../context/WebsiteContext';
import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import { TestResult, MistakeRecord } from '../types';
import {
  Award,
  BookX,
  CheckCircle2,
  Clock,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
  Flame,
  Check
} from 'lucide-react';

export const EvaluationHub: React.FC = () => {
  const { text: websiteText } = useWebsite();
  const { testResults, mistakeRecords, updateMistakeStatus, language, setActiveTab, setActiveModule } = useCurriculum();
  const { profile } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'report_cards' | 'mistake_book'>('report_cards');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(testResults[0] || null);
  const [mistakeFilter, setMistakeFilter] = useState<'all' | 'pending' | 'mastered'>('all');

  // Stats calculation
  const totalTests = testResults.length;
  const avgPercentage = totalTests > 0
    ? Math.round(testResults.reduce((acc, r) => acc + r.percentage, 0) / totalTests)
    : 0;
  const masteredMistakesCount = mistakeRecords.filter((m) => m.masteryStatus === 'mastered').length;

  const filteredMistakes = mistakeRecords.filter((m) => {
    if (mistakeFilter === 'all') return true;
    return m.masteryStatus === mistakeFilter;
  });

  return (
    <div className="flex-1 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-4 sm:p-6 flex flex-col gap-6 min-w-0">
      {/* Header */}
      <div className="border-b border-orange-100 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-cinzel flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            <span>{language === 'hi' ? websiteText("मूल्यांकन केंद्र एवं रिपोर्ट कार्ड") : websiteText("Evaluation Hub & Mistake Book")}</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {language === 'hi'
              ? websiteText("सम्पूर्ण टेस्ट विश्लेषण, अंकतालिका, शिक्षक समीक्षा एवं व्यक्तिगत मिस्टेक बुक")
              : websiteText("Complete test scorecards, accuracy analysis, Saarthi remarks & your personal Mistake Book")}
          </p>
        </div>

        {/* Tab Toggle: Report Cards vs Mistake Book */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('report_cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'report_cards'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span><WebsiteText original={"Report Cards ("} />{totalTests})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mistake_book')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'mistake_book'
                ? "bg-red-600 text-white shadow-xs"
                : "text-stone-600 hover:text-red-700"
            }`}
          >
            <BookX className="w-3.5 h-3.5" />
            <span><WebsiteText original={"Mistake Book ("} />{mistakeRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50/70 border border-orange-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide"><WebsiteText original={"Total Tests"} /></span>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-cinzel mt-1">
            {totalTests}
          </div>
          <span className="text-[10px] text-orange-800 font-medium"><WebsiteText original={"Recorded tests"} /></span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide"><WebsiteText original={"Avg Score"} /></span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-cinzel mt-1">
            {avgPercentage}%
          </div>
          <span className="text-[10px] text-emerald-800 font-medium"><WebsiteText original={"Overall accuracy"} /></span>
        </div>

        <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide"><WebsiteText original={"Mistakes Saved"} /></span>
          <div className="text-xl sm:text-2xl font-black text-red-700 font-cinzel mt-1">
            {mistakeRecords.length}
          </div>
          <span className="text-[10px] text-red-800 font-medium"><WebsiteText original={"In your book"} /></span>
        </div>

        <div className="bg-teal-50/70 border border-teal-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide"><WebsiteText original={"Mastered Errors"} /></span>
          <div className="text-xl sm:text-2xl font-black text-teal-700 font-cinzel mt-1">
            {masteredMistakesCount}
          </div>
          <span className="text-[10px] text-teal-800 font-medium"><WebsiteText original={"Converted to strength"} /></span>
        </div>
      </div>

      {/* View 1: Report Cards View */}
      {activeSubTab === 'report_cards' && (
        <div className="space-y-6">
          {testResults.length === 0 ? (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-3xl p-8 text-center max-w-lg mx-auto">
              <Award className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="font-bold text-base text-stone-800 font-cinzel"><WebsiteText original={"No Tests Attempted Yet"} /></h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto"><WebsiteText original={"Head over to the Curriculum Learning Hub and choose "} /><strong><WebsiteText original={"\"Test Yourself\""} /></strong><WebsiteText original={" on any chapter to start your first evaluation!"} /></p>
              <button
                onClick={() => {
                  setActiveTab('learning');
                  setActiveModule('test_yourself');
                }}
                className="mt-4 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
              ><WebsiteText original={"Go to Test Yourself"} /></button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List of Report Cards */}
              <div className="space-y-3 lg:col-span-1">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block"><WebsiteText original={"Completed Evaluations"} /></span>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {testResults.map((res) => {
                    const isSelected = selectedResult?.id === res.id;
                    return (
                      <div
                        key={res.id}
                        onClick={() => setSelectedResult(res)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? "bg-orange-50 border-orange-400 shadow-sm"
                            : "bg-white hover:bg-stone-50 border-stone-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                            {res.testType}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(res.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                          {res.testTitle}
                        </h4>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-xs">
                          <span className="font-bold text-emerald-700">
                            {res.score} / {res.totalMarks} ({res.percentage}%)
                          </span>
                          <span className="text-stone-500 font-mono text-[11px]">
                            {Math.round(res.timeTakenSeconds / 60)}<WebsiteText original={"m "} />{res.timeTakenSeconds % 60}<WebsiteText original={"s"} /></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Selected Report Card Deep Dive */}
              <div className="lg:col-span-2">
                {selectedResult ? (
                  <div className="bg-white border-2 border-orange-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
                    {/* Header Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                          {selectedResult.board} • {selectedResult.classGrade}
                        </span>
                        <h3 className="font-black text-lg sm:text-xl text-stone-900 font-cinzel mt-1">
                          {selectedResult.testTitle}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-600 font-cinzel">
                          {selectedResult.score} / {selectedResult.totalMarks}
                        </span>
                        <div className="text-xs text-stone-500 font-semibold">
                          {selectedResult.percentage}<WebsiteText original={"% Score • "} />{selectedResult.accuracy}<WebsiteText original={"% Accuracy"} /></div>
                      </div>
                    </div>

                    {/* Remarks Banner */}
                    <div className="bg-amber-50/70 border border-orange-200 p-3.5 rounded-2xl text-xs sm:text-sm text-stone-800 leading-relaxed font-serif italic">
                      <span className="font-bold text-orange-950 font-sans not-italic block mb-0.5"><WebsiteText original={"Saarthi Academic Remarks:"} /></span>
                      "{selectedResult.remarks}"
                    </div>

                    {/* Breakdown Badges */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                        <span className="font-bold text-emerald-900 block mb-1"><WebsiteText original={"Top Concepts Mastered:"} /></span>
                        <div className="flex flex-wrap gap-1">
                          {selectedResult.strengths.map((s, i) => (
                            <span
                              key={i}
                              className="bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[11px]"
                            >
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl">
                        <span className="font-bold text-orange-950 block mb-1"><WebsiteText original={"Improvement Targets:"} /></span>
                        <div className="flex flex-wrap gap-1">
                          {selectedResult.weaknesses.map((w, i) => (
                            <span
                              key={i}
                              className="bg-white text-orange-900 px-2 py-0.5 rounded border border-orange-200 text-[11px]"
                            >
                              ! {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Question by Question Answer Review */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider"><WebsiteText original={"Response Key & Explanations:"} /></h4>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedResult.answers.map((ans, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs ${
                              ans.isCorrect
                                ? "bg-emerald-50/40 border-emerald-200"
                                : "bg-red-50/40 border-red-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1 font-bold">
                              <span><WebsiteText original={"Question "} />{idx + 1}</span>
                              <span className={ans.isCorrect ? "text-emerald-700" : "text-red-700"}>
                                {ans.isCorrect ? websiteText("Correct (+1)") : websiteText("Incorrect (Added to Mistake Book)")}
                              </span>
                            </div>
                            <p className="text-stone-800 font-medium mb-1.5">{ans.questionText}</p>
                            <p className="text-[11px] text-stone-600 bg-white p-2 rounded-lg border border-stone-200">
                              <span className="font-semibold text-stone-800"><WebsiteText original={"Explanation:"} /></span>{' '}
                              {ans.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl border"><WebsiteText original={"Select a report card to view full analysis."} /></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Mistake Book Tab (Dedicated Error Remediation Engine) */}
      {activeSubTab === 'mistake_book' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-red-950 font-cinzel flex items-center gap-2">
                <BookX className="w-5 h-5 text-red-600" />
                <span><WebsiteText original={"The Sankatmochan Mistake Book"} /></span>
              </h3>
              <p className="text-xs text-red-900 mt-0.5"><WebsiteText original={"Every incorrect test response is logged here. Review explanations and mark as "} /><strong><WebsiteText original={"Mastered"} /></strong><WebsiteText original={" once understood!"} /></p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-red-200 text-xs">
              <button
                onClick={() => setMistakeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  mistakeFilter === 'all' ? "bg-red-600 text-white" : "text-stone-600"
                }`}
              ><WebsiteText original={"All ("} />{mistakeRecords.length})
              </button>
              <button
                onClick={() => setMistakeFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  mistakeFilter === 'pending' ? "bg-red-600 text-white" : "text-stone-600"
                }`}
              ><WebsiteText original={"Needs Review ("} />{mistakeRecords.filter((m) => m.masteryStatus !== 'mastered').length})
              </button>
              <button
                onClick={() => setMistakeFilter('mastered')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  mistakeFilter === 'mastered' ? "bg-emerald-600 text-white" : "text-stone-600"
                }`}
              ><WebsiteText original={"Mastered ("} />{masteredMistakesCount})
              </button>
            </div>
          </div>

          {filteredMistakes.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs"><WebsiteText original={"No mistakes match this filter. Great job!"} /></div>
          ) : (
            <div className="space-y-3">
              {filteredMistakes.map((m) => {
                const isMastered = m.masteryStatus === 'mastered';

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isMastered
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-white border-red-200 hover:border-red-300"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {m.subjectId}
                      </span>

                      <div className="flex items-center gap-2">
                        {isMastered ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5" /><WebsiteText original={" Concept Mastered"} /></span>
                        ) : (
                          <button
                            onClick={() => updateMistakeStatus(m.id, 'mastered')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /><WebsiteText original={" Mark as Mastered"} /></button>
                        )}
                        {!isMastered && (
                          <button
                            onClick={() => updateMistakeStatus(m.id, 'reviewed')}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs"
                          ><WebsiteText original={"Mark Reviewed"} /></button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 mb-2 leading-relaxed">
                      {m.questionText}
                    </h4>

                    <div className="bg-amber-50/70 border border-orange-200 rounded-xl p-3 text-xs space-y-1">
                      <div className="text-red-700">
                        <span className="font-bold"><WebsiteText original={"Your Selection:"} /></span>{' '}
                        {m.selectedOption >= 0
                          ? `Option ${String.fromCharCode(65 + m.selectedOption)}`
                          : websiteText("Unattempted")}
                      </div>
                      <div className="text-emerald-700">
                        <span className="font-bold"><WebsiteText original={"Correct Solution:"} /></span><WebsiteText original={" Option"} />{' '}
                        {String.fromCharCode(65 + m.correctOption)}
                      </div>
                      <div className="pt-1.5 text-stone-700 leading-relaxed border-t border-orange-200/60 mt-1">
                        <span className="font-semibold text-orange-950"><WebsiteText original={"Detailed Explanation: "} /></span>
                        {m.explanation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
