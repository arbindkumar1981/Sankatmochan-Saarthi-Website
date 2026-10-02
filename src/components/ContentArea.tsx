import React, { useState, useEffect } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import {
  LearningContent,
  EvaluationTest,
  TestQuestion,
  TestResultAnswer,
  FlashcardItem
} from '../types';
import confetti from 'canvas-confetti';
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
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Clock,
  Award,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  Share2,
  Download,
  WandSparkles,
  Youtube,
  Play,
  ExternalLink
} from 'lucide-react';

export const ContentArea: React.FC = () => {
  const {
    activeModule,
    selectedBoard,
    selectedClass,
    selectedStream,
    selectedSubject,
    selectedChapter,
    selectedTopic,
    language,
    learningContents,
    evaluationTests,
    youtubeVideos,
    saveTestResult
  } = useCurriculum();

  const { profile, user, openAuthModal } = useAuth();

  // Find relevant content matching the subject/chapter/topic and module type
  const matchedContent = learningContents.find((c) => {
    if (c.contentType !== activeModule) return false;
    if (c.subjectId !== selectedSubject?.id) return false;
    if (selectedChapter && c.chapterId !== selectedChapter.id) return false;
    if (selectedTopic) {
      const topicMatches = c.topicId === selectedTopic.id || (c.topicTitle || '').trim().toLowerCase() === selectedTopic.title.trim().toLowerCase();
      if (!topicMatches) return false;
    }
    return true;
  });

  const hasPublishedModuleContent = Boolean(matchedContent?.approved && matchedContent?.published);

  // Fallback default content if none matches
  const displayContent = matchedContent || {
    id: 'placeholder',
    contentType: activeModule,
    board: selectedBoard,
    classGrade: selectedClass,
    stream: selectedStream,
    subjectId: selectedSubject?.id || '',
    subjectName: selectedSubject?.name || '',
    chapterId: selectedChapter?.id || '',
    chapterTitle: selectedChapter?.title || '',
    title: `${selectedSubject?.name || 'Subject'}: ${selectedChapter?.title || 'Chapter'} - ${activeModule.replace('_', ' ').toUpperCase()}`,
    hindiTitle: `${selectedSubject?.hindiName || ''} - ${selectedChapter?.hindiTitle || ''}`,
    bodyText: `### Content not yet published\nVerified learning material for **${selectedChapter?.title || 'this chapter'}** is not available yet. Please choose another published topic or check again after the academic content is approved.`,
    bodyHindi: `### सामग्री अभी प्रकाशित नहीं है\n**${selectedChapter?.hindiTitle || 'इस अध्याय'}** के लिए सत्यापित अध्ययन सामग्री अभी उपलब्ध नहीं है। कृपया कोई अन्य प्रकाशित विषय चुनें या सामग्री अनुमोदित होने के बाद पुनः देखें।`,
    version: 1,
    approved: true,
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Student on-demand Teacher Agent generation (Detailed/Revision Notes first).
  const [studentGeneratedText, setStudentGeneratedText] = useState('');
  const [studentGenerating, setStudentGenerating] = useState(false);
  const [studentGenerationError, setStudentGenerationError] = useState('');

  const teacherSubjectName = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('physics')) return 'Physics';
    if (n.includes('chemistry')) return 'Chemistry';
    if (n.includes('biology')) return 'Biology';
    if (n.includes('mathematics') || n.includes('math')) return 'Mathematics';
    if (n.includes('history')) return 'History';
    if (n.includes('geography')) return 'Geography';
    if (n.includes('political')) return 'Political Science';
    if (n.includes('economics')) return 'Economics';
    if (n.includes('science')) return 'Science';
    if (n.includes('english')) return 'English';
    if (n.includes('hindi')) return 'Hindi';
    return name;
  };

  const generateWithTeacher = async () => {
    if (!profile || !user) { openAuthModal('student'); return; }
    if (!selectedSubject || !selectedChapter) return;
    const api = import.meta.env.VITE_SAARTHI_API_URL;
    if (!api) { setStudentGenerationError('Saarthi Teacher service is not configured.'); return; }
    setStudentGenerating(true); setStudentGenerationError('');
    try {
      const token = await user.getIdToken();
      const assetType = activeModule === 'revision_notes' ? 'REVISION_NOTES' : 'DETAILED_NOTES';
      const topic = selectedTopic?.title || selectedChapter.title;
      const res = await fetch(`${api}/v1/website/teacher/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          board: selectedBoard, class_name: selectedClass.replace('Class ', selectedClass === 'Class 9' ? 'IX' : selectedClass === 'Class 10' ? 'X' : selectedClass === 'Class 11' ? 'XI' : 'XII'),
          subject: teacherSubjectName(selectedSubject.name), language, asset_type: assetType,
          topic_id: `${selectedSubject.id}:${selectedChapter.id}:${selectedTopic?.id || 'chapter'}`,
          knowledge: { verification_status: 'VERIFIED', facts: [`Curriculum topic: ${topic}; chapter: ${selectedChapter.title}`], provenance: [{ source: 'Saarthi curriculum selection', board: selectedBoard }] }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Teacher Agent could not generate this material.');
      setStudentGeneratedText(data.content || '');
    } catch (e:any) { setStudentGenerationError(e.message || 'Generation failed. Please try again.'); }
    finally { setStudentGenerating(false); }
  };

  const downloadGeneratedNotes = () => {
    if (!studentGeneratedText) return;
    const safeTitle = `${selectedSubject?.name || 'Saarthi'}-${selectedChapter?.title || 'Notes'}-${activeModule}`.replace(/[^a-z0-9-_]+/gi, '-');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.65;max-width:900px;margin:40px auto;padding:20px;color:#292524}h1{color:#9a3412}.wm{position:fixed;bottom:20px;right:20px;opacity:.35;font-size:12px}</style></head><body><h1>SankatmochanSaarthi</h1><h2>${selectedSubject?.name || ''} — ${selectedChapter?.title || ''}</h2><pre style="white-space:pre-wrap;font:inherit">${studentGeneratedText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div class="wm">Generated for ${profile?.displayName || 'Student'} • SankatmochanSaarthi</div></body></html>`;
    const blob = new Blob([html], {type:'text/html;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=safeTitle+'.html'; a.click(); URL.revokeObjectURL(url);
  };

  // State for Flashcards
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardMastery, setCardMastery] = useState<Record<string, 'mastered' | 'review'>>({});

  // State for Copy Formula Feedback
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // State for Test Yourself
  const matchedTests = evaluationTests.filter((t) => {
    if (t.subjectId !== selectedSubject?.id) return false;
    if (selectedChapter && t.chapterId && t.chapterId !== selectedChapter.id) return false;
    return true;
  });

  // Never serve an unrelated fallback test from another subject/chapter.
  const activeTest: EvaluationTest | undefined = matchedTests[0];

  // Reset interactive module state whenever curriculum/module selection changes.
  useEffect(() => {
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    setTestStarted(false);
    setTestSubmitted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmittedScorecard(null);
    setStudentGeneratedText('');
    setStudentGenerationError('');
  }, [activeModule, selectedSubject?.id, selectedChapter?.id, selectedTopic?.id]);

  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [testTimeRemaining, setTestTimeRemaining] = useState(600); // 10 mins
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [submittedScorecard, setSubmittedScorecard] = useState<{
    score: number;
    totalMarks: number;
    percentage: number;
    accuracy: number;
    timeTaken: number;
    remarks: string;
    strengths: string[];
    weaknesses: string[];
    answers: TestResultAnswer[];
  } | null>(null);

  // Timer effect for test
  useEffect(() => {
    let interval: any = null;
    if (testStarted && !testSubmitted && testTimeRemaining > 0) {
      interval = setInterval(() => {
        setTestTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, testSubmitted, testTimeRemaining]);

  const handleStartTest = () => {
    if (!profile) {
      openAuthModal('student');
      return;
    }
    setTestStarted(true);
    setTestSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTestTimeRemaining((activeTest?.durationMinutes || 15) * 60);
    setSubmittedScorecard(null);
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleAutoSubmit = async () => {
    if (!activeTest) return;
    const questions = activeTest.questions;
    let score = 0;
    const answers: TestResultAnswer[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      const isCorrect = selected === q.correctIndex;
      const marksAwarded = isCorrect ? q.marks : 0;
      score += marksAwarded;

      if (isCorrect) {
        if (q.competencyTag && !strengths.includes(q.competencyTag)) {
          strengths.push(q.competencyTag);
        }
      } else {
        if (q.competencyTag && !weaknesses.includes(q.competencyTag)) {
          weaknesses.push(q.competencyTag);
        }
      }

      answers.push({
        questionId: q.id,
        questionText: q.questionText,
        selectedOption: selected,
        correctOption: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
        marksAwarded
      });
    });

    const totalMarks = activeTest.totalMarks || questions.length;
    const percentage = Math.round((score / totalMarks) * 100);
    const attemptedCount = Object.keys(selectedAnswers).length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const timeTaken = (activeTest.durationMinutes * 60) - testTimeRemaining;

    let remarks = '';
    if (percentage >= 80) {
      remarks = 'उत्कृष्ट प्रदर्शन! Baba Neem Karoli Ji & Hanuman Ji bless your hard work. Concepts are exceptionally strong.';
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } else if (percentage >= 50) {
      remarks = 'सराहनीय प्रयास! Good conceptual grasp. Review the questions saved to your Mistake Book to achieve top rank.';
    } else {
      remarks = 'अध्ययन में लगन बढ़ाएं! Do not worry. Every mistake is a stepping stone to mastery. Re-read the revision notes and re-attempt.';
    }

    const resultPayload = {
      studentUid: profile?.uid || 'guest-108',
      studentName: profile?.displayName || 'Student',
      testId: activeTest.id,
      testTitle: activeTest.title,
      testType: activeTest.testType,
      board: selectedBoard,
      classGrade: selectedClass,
      subjectId: selectedSubject?.id || '',
      score,
      totalMarks,
      percentage,
      accuracy,
      timeTakenSeconds: timeTaken,
      answers,
      strengths: strengths.length > 0 ? strengths : ['Conceptual grasp'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['None! Ready for boards'],
      remarks,
      createdAt: new Date().toISOString()
    };

    setSubmittedScorecard({
      score,
      totalMarks,
      percentage,
      accuracy,
      timeTaken,
      remarks,
      strengths: resultPayload.strengths,
      weaknesses: resultPayload.weaknesses,
      answers
    });
    setTestSubmitted(true);
    setTestStarted(false);

    try {
      await saveTestResult(resultPayload);
    } catch (err) {
      console.error('Error saving result:', err);
    }
  };

  const handleCopyFormula = (id: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormulaId(id);
    setTimeout(() => setCopiedFormulaId(null), 2000);
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-4 sm:p-6 flex flex-col min-w-0">
      {/* Module Title Header */}
      <div className="border-b border-orange-100 pb-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
              {activeModule.replace('_', ' ')}
            </span>
            <span className="text-xs text-stone-500 font-semibold">
              {selectedBoard} • {selectedClass} • {selectedSubject?.name}
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-stone-900 font-cinzel mt-1">
            {language === 'hi' ? displayContent.hindiTitle || displayContent.title : displayContent.title}
          </h2>

          {selectedChapter && (
            <p className="text-xs text-orange-700 font-medium mt-0.5">
              Chapter {selectedChapter.chapterNumber}: {selectedChapter.title}
              {selectedTopic && ` → ${selectedTopic.title}`}
            </p>
          )}
        </div>
      </div>

      {/* Recommended Videos: curated separately from normal YouTube Search */}
      {activeModule === 'recommended_videos' && (
        <div className="space-y-4">
          {(() => {
            const videos = youtubeVideos.filter((v) => {
              if (!v.approved || !v.published) return false;
              if (v.board && v.board !== selectedBoard) return false;
              if (v.classGrade !== selectedClass) return false;
              if (selectedSubject && v.subjectId !== selectedSubject.id) return false;
              if (selectedChapter && v.chapterId !== selectedChapter.id) return false;
              if (selectedTopic && v.topicId && v.topicId !== selectedTopic.id && (v.topicTitle || '').toLowerCase() !== selectedTopic.title.toLowerCase()) return false;
              return true;
            });
            if (!videos.length) return <div className="p-6 text-center border border-dashed border-orange-300 rounded-2xl text-sm text-stone-600">No Saarthi Recommended Video has been published for this selection yet.</div>;
            return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{videos.map(v => (
              <div key={v.id} className="border border-red-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="aspect-video bg-black">
                  <iframe src={`https://www.youtube.com/embed/${v.youtubeId}?rel=0&modestbranding=1&playsinline=1`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full border-0" />
                </div>
                <div className="p-3">
                  <div className="flex items-start gap-2"><Youtube className="w-5 h-5 text-red-600 shrink-0"/><div><h3 className="font-bold text-sm text-stone-900">{v.title}</h3><p className="text-[11px] text-stone-500 mt-0.5">{v.channelTitle}{v.topicTitle ? ` • ${v.topicTitle}` : ''}{v.subtopicTitle ? ` → ${v.subtopicTitle}` : ''}</p></div></div>
                  <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:underline"><Play className="w-3.5 h-3.5"/>Watch on YouTube<ExternalLink className="w-3 h-3"/></a>
                </div>
              </div>
            ))}</div>;
          })()}
        </div>
      )}

      {/* Module 1 & 2: Detailed Notes & Revision Notes */}
      {(activeModule === 'detailed_notes' || activeModule === 'revision_notes') && (
        <div className="space-y-4 select-none" onCopy={(e)=>e.preventDefault()} onCut={(e)=>e.preventDefault()} onContextMenu={(e)=>e.preventDefault()}>
          <div className="flex flex-wrap items-center gap-2 justify-between bg-orange-50 border border-orange-200 rounded-2xl p-3">
            <div><div className="font-bold text-sm text-orange-950">Saarthi Teacher Agent</div><div className="text-[11px] text-stone-600">Generate this material for your selected chapter/topic and language.</div></div>
            <div className="flex gap-2">
              <button onClick={generateWithTeacher} disabled={studentGenerating} className="px-3 py-2 rounded-xl bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"><WandSparkles className="w-4 h-4"/>{studentGenerating ? 'Generating…' : 'Generate with Teacher'}</button>
              {studentGeneratedText && <button onClick={downloadGeneratedNotes} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5"><Download className="w-4 h-4"/>Download</button>}
            </div>
          </div>
          {studentGenerationError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">{studentGenerationError}</div>}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 font-serif leading-relaxed flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                {language === 'hi'
                  ? matchedContent?.approved && matchedContent?.published
                    ? 'संकटमोचन सत्यापित सामग्री: अनुमोदित शैक्षणिक सामग्री प्रकाशित है।'
                    : 'इस चयन के लिए सत्यापित सामग्री अभी प्रकाशित नहीं हुई है।'
                  : matchedContent?.approved && matchedContent?.published
                    ? 'Sankatmochan Verified: Published academic content.'
                    : 'No verified content has been published for this selection yet.'}
              </span>
            </span>
          </div>

          <div className="prose prose-stone max-w-none text-stone-800 leading-relaxed text-sm sm:text-base space-y-4 whitespace-pre-line bg-gradient-to-b from-stone-50/50 to-white p-5 rounded-2xl border border-stone-200/70 font-sans">
            {studentGeneratedText || (language === 'hi' && displayContent.bodyHindi
              ? displayContent.bodyHindi
              : displayContent.bodyText)}
          </div>
        </div>
      )}

      {/* Module 3: Definitions & Formulae */}
      {activeModule === 'formulae' && (
        <div className="space-y-4">
          {!hasPublishedModuleContent || !(displayContent.formulaItems?.length) ? (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">No verified definitions or formulae have been published for this selection yet.</div>
          ) : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(displayContent.formulaItems || []).map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 border border-orange-200 rounded-2xl p-4 shadow-xs relative hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                  <button
                    onClick={() => handleCopyFormula(item.id, item.formula)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-100 transition-colors"
                    title="Copy Formula"
                  >
                    {copiedFormulaId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="my-2.5 p-2.5 bg-white border border-orange-300 rounded-xl font-mono text-center font-bold text-orange-950 text-base sm:text-lg shadow-inner">
                  {item.formula}
                </div>

                <p className="text-xs text-stone-700 leading-relaxed">
                  {language === 'hi' && item.definitionHindi ? item.definitionHindi : item.definition}
                </p>

                {item.units && (
                  <div className="mt-2 text-[11px] text-stone-500 font-mono">
                    <span className="font-semibold text-orange-800">Units:</span> {item.units}
                  </div>
                )}
                {item.application && (
                  <div className="mt-1 text-[11px] text-stone-600">
                    <span className="font-semibold text-orange-800">Use:</span> {item.application}
                  </div>
                )}
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* Module 4: Mind Maps */}
      {activeModule === 'mindmaps' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-200 rounded-2xl p-6 text-center">
            <GitBranch className="w-12 h-12 text-purple-600 mx-auto mb-2 animate-bounce" />
            <h3 className="font-bold text-base text-stone-900 font-cinzel">
              Visual Concept Hierarchy & Flowchart
            </h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
              Structural concept connections designed for photographic memory retention.
            </p>

            <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-3">
              <div className="bg-white border-2 border-orange-500 px-4 py-2.5 rounded-xl shadow-md font-bold text-sm text-orange-900">
                {selectedChapter?.title || 'Chapter Core'}
              </div>
              <span className="text-orange-400 font-bold hidden md:inline">→</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-left text-xs shadow-xs">
                  <span className="font-bold text-orange-800 block mb-1">Pillar 1: Fundamental Laws</span>
                  <span>Definitions, experimental validations, conditions, and core postulates.</span>
                </div>
                <div className="bg-orange-50 border border-orange-300 p-3 rounded-xl text-left text-xs shadow-xs">
                  <span className="font-bold text-orange-800 block mb-1">Pillar 2: Mathematical Models</span>
                  <span>Governing formulas, unit conversions, and quantitative relations.</span>
                </div>
                <div className="bg-red-50 border border-red-300 p-3 rounded-xl text-left text-xs shadow-xs">
                  <span className="font-bold text-red-800 block mb-1">Pillar 3: High-Frequency PYQs</span>
                  <span>Direct definitions, repeated board derivations, numericals.</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-left text-xs shadow-xs">
                  <span className="font-bold text-emerald-800 block mb-1">Pillar 4: Practical Applications</span>
                  <span>Daily life occurrences, technological devices, case studies.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module 5: Interactive Flashcards */}
      {activeModule === 'flashcards' && (
        <div className="space-y-4 max-w-xl mx-auto w-full">
          {displayContent.flashcardItems && displayContent.flashcardItems.length > 0 ? (
            <div>
              {/* Counter & Controls */}
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span>
                  Card {currentFlashcardIndex + 1} of {displayContent.flashcardItems.length}
                </span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  Click card to flip
                </span>
              </div>

              {/* Flashcard Body */}
              {(() => {
                const card = displayContent.flashcardItems[currentFlashcardIndex];
                return (
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer min-h-[220px] sm:min-h-[260px] bg-gradient-to-br from-amber-50 to-orange-100/60 border-2 border-orange-300 hover:border-orange-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg transition-all transform hover:-translate-y-0.5 select-none relative"
                  >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-bold uppercase tracking-wider">
                      <span>{isFlipped ? 'Answer / Solution' : 'Question / Recall Prompt'}</span>
                      <RotateCw className="w-4 h-4 text-orange-600" />
                    </div>

                    <div className="my-auto text-center py-4">
                      {isFlipped ? (
                        <p className="text-sm sm:text-base text-stone-900 font-medium leading-relaxed whitespace-pre-line">
                          {language === 'hi' && card.answerHindi ? card.answerHindi : card.answer}
                        </p>
                      ) : (
                        <h3 className="text-base sm:text-xl font-bold text-stone-900 font-cinzel leading-snug">
                          {language === 'hi' && card.questionHindi ? card.questionHindi : card.question}
                        </h3>
                      )}
                      {!isFlipped && card.hint && (
                        <p className="text-xs text-stone-500 italic mt-3">Hint: {card.hint}</p>
                      )}
                    </div>

                    <div className="text-center text-[11px] text-stone-400">
                      {isFlipped ? 'Tap to see question again' : 'Tap to reveal answer'}
                    </div>
                  </div>
                );
              })()}

              {/* Navigation and Mastery Buttons */}
              <div className="flex items-center justify-between gap-3 mt-4">
                <button
                  disabled={currentFlashcardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentFlashcardIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="px-4 py-2 bg-stone-100 disabled:opacity-40 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const id = displayContent.flashcardItems![currentFlashcardIndex].id;
                      setCardMastery((prev) => ({ ...prev, [id]: 'mastered' }));
                      if (currentFlashcardIndex < displayContent.flashcardItems!.length - 1) {
                        setIsFlipped(false);
                        setCurrentFlashcardIndex((prev) => prev + 1);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Got It
                  </button>
                  <button
                    onClick={() => {
                      const id = displayContent.flashcardItems![currentFlashcardIndex].id;
                      setCardMastery((prev) => ({ ...prev, [id]: 'review' }));
                      if (currentFlashcardIndex < displayContent.flashcardItems!.length - 1) {
                        setIsFlipped(false);
                        setCurrentFlashcardIndex((prev) => prev + 1);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Needs Review
                  </button>
                </div>

                <button
                  disabled={currentFlashcardIndex === displayContent.flashcardItems.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentFlashcardIndex((prev) =>
                      Math.min(displayContent.flashcardItems!.length - 1, prev + 1)
                    );
                  }}
                  className="px-4 py-2 bg-stone-100 disabled:opacity-40 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
              No verified flashcards have been published for this selection yet.
            </div>
          )}
        </div>
      )}

      {/* Module 6: Previous Year Questions (PYQs) */}
      {activeModule === 'pyqs' && (
        <div className="space-y-4">
          {!(displayContent.pyqItems?.length) && <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">No verified previous-year questions have been published for this selection yet.</div>}
          {(displayContent.pyqItems || []).map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-orange-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                    {item.year}
                  </span>
                  <span className="text-xs font-bold text-stone-700">
                    [{item.marks} {item.marks === 1 ? 'Mark' : 'Marks'}]
                  </span>
                </div>
                {item.repeatedFrequency && (
                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                    ★ {item.repeatedFrequency}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                Q{idx + 1}. {language === 'hi' && item.questionHindi ? item.questionHindi : item.question}
              </h4>

              <div className="mt-3 bg-amber-50/50 border border-orange-200/60 rounded-xl p-3.5 text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed font-sans">
                <span className="font-bold text-orange-900 block mb-1 text-xs uppercase tracking-wide">
                  Model Solution & Marking Points:
                </span>
                {language === 'hi' && item.solutionHindi ? item.solutionHindi : item.solution}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module 7 & 8: Competency-Based Questions (CBQs) & Case-Based Studies */}
      {(activeModule === 'cbqs' || activeModule === 'case_studies') && (
        <div className="space-y-5">
          {displayContent.caseStudyItem ? (
            <div className="bg-gradient-to-br from-teal-50/40 via-amber-50/20 to-orange-50/30 border border-teal-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Case Study Passage
                </span>
                <h3 className="font-bold text-sm sm:text-base text-stone-900">
                  {displayContent.caseStudyItem.title}
                </h3>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 text-xs sm:text-sm leading-relaxed text-stone-700 font-serif my-3 italic">
                {language === 'hi' && displayContent.caseStudyItem.caseHindi
                  ? displayContent.caseStudyItem.caseHindi
                  : displayContent.caseStudyItem.caseText}
              </div>

              <div className="space-y-4 mt-4">
                {displayContent.caseStudyItem.questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-white p-4 rounded-xl border border-teal-100">
                    <p className="font-bold text-xs sm:text-sm text-stone-900 mb-2">
                      ({qIdx + 1}) {q.question}
                    </p>
                    <div className="space-y-1.5 pl-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-teal-50/60"
                        >
                          <span className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center font-bold text-[10px] text-stone-600 shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-stone-100 text-[11px] text-teal-800">
                      <span className="font-bold">Correct Key: </span> Option {String.fromCharCode(65 + q.correctIndex)} — {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-orange-200 p-5 rounded-2xl text-xs sm:text-sm text-stone-700">
              <h4 className="font-bold text-orange-900 mb-1">{activeModule === 'cbqs' ? 'Competency-Based Questions' : 'Case-Based Study'}</h4>
              <p>No verified {activeModule === 'cbqs' ? 'competency-based questions' : 'case-based study'} have been published for this selection yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Module 9: Test Yourself (Interactive Objective Testing Engine) */}
      {activeModule === 'test_yourself' && (
        <div className="space-y-5">
          {!activeTest && (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">No published test is available for this subject/chapter selection yet.</div>
          )}
          {activeTest && !testStarted && !testSubmitted && (
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white border-2 border-orange-300 rounded-3xl p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-md">
              <CheckSquare className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-cinzel">
                {activeTest?.title || 'Interactive Assessment Test'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-lg mx-auto">
                Test your knowledge under timed exam conditions. Instant automatic evaluation, question-by-question explanations, and automatic addition of any wrong answers to your personal <strong>Mistake Book</strong>!
              </p>

              <div className="grid grid-cols-3 gap-3 my-6 text-xs max-w-md mx-auto">
                <div className="bg-white border border-orange-200 p-3 rounded-2xl shadow-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Questions</span>
                  <span className="text-lg font-black text-stone-800">
                    {activeTest?.questions.length || 5}
                  </span>
                </div>
                <div className="bg-white border border-orange-200 p-3 rounded-2xl shadow-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Duration</span>
                  <span className="text-lg font-black text-orange-600">
                    {activeTest?.durationMinutes || 15} Mins
                  </span>
                </div>
                <div className="bg-white border border-orange-200 p-3 rounded-2xl shadow-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Marks</span>
                  <span className="text-lg font-black text-stone-800">
                    {activeTest?.totalMarks || 10}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartTest}
                className="py-3 px-8 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                {language === 'hi' ? 'परीक्षा प्रारंभ करें' : 'Start Test Now'}
              </button>
            </div>
          )}

          {/* Test In Progress */}
          {testStarted && activeTest && (
            <div className="space-y-4 max-w-3xl mx-auto w-full">
              {/* Test Top Bar */}
              <div className="bg-stone-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-bold uppercase font-cinzel">
                    {activeTest.testType} Test
                  </span>
                  <span className="text-stone-400 text-xs">| Question {currentQuestionIndex + 1} of {activeTest.questions.length}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-red-900/60 border border-red-500/40 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-red-200">
                  <Clock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>
                    {Math.floor(testTimeRemaining / 60)}:
                    {(testTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              {(() => {
                const q = activeTest.questions[currentQuestionIndex];
                const selectedOpt = selectedAnswers[currentQuestionIndex];

                return (
                  <div className="bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-md">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h4 className="font-bold text-stone-900 text-base sm:text-lg leading-snug">
                        Q{currentQuestionIndex + 1}. {language === 'hi' && q.questionHindi ? q.questionHindi : q.questionText}
                      </h4>
                      <span className="bg-orange-100 text-orange-900 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-all ${
                              isChosen
                                ? 'bg-orange-500 text-white border-orange-600 shadow-md font-bold'
                                : 'bg-stone-50 hover:bg-orange-50/60 text-stone-800 border-stone-200'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isChosen
                                  ? 'bg-white text-orange-600'
                                  : 'bg-white border border-stone-300 text-stone-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Navigation & Submit */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 bg-stone-100 disabled:opacity-40 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {currentQuestionIndex < activeTest.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleAutoSubmit}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Submit Test
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test Completed - Instant Scorecard & Detailed Review */}
          {testSubmitted && submittedScorecard && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Scorecard Header Banner */}
              <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Award className="w-36 h-36" />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-white/20 px-3 py-1 rounded-full">
                  Test Evaluation Report Card
                </span>

                <h3 className="text-2xl sm:text-3xl font-black font-cinzel mt-3">
                  Score: {submittedScorecard.score} / {submittedScorecard.totalMarks}
                </h3>
                <p className="text-amber-100 font-bold text-sm sm:text-base mt-1">
                  Percentage: {submittedScorecard.percentage}% • Accuracy: {submittedScorecard.accuracy}%
                </p>

                <p className="text-xs sm:text-sm text-white/95 mt-3 max-w-lg mx-auto bg-black/20 p-3 rounded-2xl border border-white/20 italic font-serif">
                  "{submittedScorecard.remarks}"
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-5 text-xs">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <span className="block font-bold text-amber-200">Strengths</span>
                    <span>{submittedScorecard.strengths.join(', ')}</span>
                  </div>
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <span className="block font-bold text-amber-200">Focus Areas</span>
                    <span>{submittedScorecard.weaknesses.join(', ')}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleStartTest}
                    className="px-5 py-2 bg-white text-orange-900 font-bold rounded-xl text-xs shadow-md hover:bg-amber-50 transition-colors"
                  >
                    Retry Test
                  </button>
                </div>
              </div>

              {/* Question by Question Detailed Review */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-base text-stone-900 font-cinzel">
                  Detailed Question Analysis & Explanations:
                </h4>

                {submittedScorecard.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${
                      ans.isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-stone-700">Question {idx + 1}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          ans.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ans.isCorrect ? 'Correct (+1)' : 'Saved to Mistake Book'}
                      </span>
                    </div>

                    <p className="font-semibold text-xs sm:text-sm text-stone-900 mb-2">
                      {ans.questionText}
                    </p>

                    <div className="text-xs space-y-1 text-stone-700">
                      <div>
                        Your Answer:{' '}
                        <span className="font-bold">
                          {ans.selectedOption >= 0
                            ? `Option ${String.fromCharCode(65 + ans.selectedOption)}`
                            : 'Not Attempted'}
                        </span>
                      </div>
                      <div>
                        Correct Answer:{' '}
                        <span className="font-bold text-emerald-700">
                          Option {String.fromCharCode(65 + ans.correctOption)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-200/60 text-xs text-stone-600 bg-white p-2.5 rounded-xl">
                      <span className="font-bold text-orange-900">Explanation: </span>
                      {ans.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
