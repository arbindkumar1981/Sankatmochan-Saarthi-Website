import { RequestScope } from '../services/requestScope';
import { parseGeneratedFlashcards, parseGeneratedMindmap } from '../services/generatedLearning';
import { DEFAULT_WEBSITE_CONFIG } from '../services/websiteConfig';
import { optionLabel } from '../services/websiteConfig';
import { useWebsite } from '../context/WebsiteContext';
import { WebsiteText } from '../context/WebsiteContext';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { parseGeneratedQuestions } from '../services/testAssessment';
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
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { prepareSavedMaterial, matchesMaterialSelection } from '../services/savedMaterials';
import { matchesUploadedTopic } from '../services/uploadedTopics';
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

const StudyPdfReader = lazy(() => import('./StudyPdfReader').then(module => ({ default: module.StudyPdfReader })));

export const ContentArea: React.FC = () => {
  const { config, text: websiteText } = useWebsite();
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
    if (c.board !== selectedBoard || c.classGrade !== selectedClass || !c.approved || !c.published) return false;
    if (c.contentType !== activeModule) return false;
    if (!selectedSubject || !matchesMaterialSelection(c, selectedSubject, selectedChapter || undefined)) return false;
    if (selectedTopic) {
      const topicMatches = matchesUploadedTopic(c, selectedTopic);
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
    bodyText: `Content not yet published
Verified learning material for ${selectedChapter?.title || 'this chapter'} is not available yet. Please choose another published topic or check again after the academic content is approved.`,
    bodyHindi: `सामग्री अभी प्रकाशित नहीं है
${selectedChapter?.hindiTitle || 'इस अध्याय'} के लिए सत्यापित अध्ययन सामग्री अभी उपलब्ध नहीं है। कृपया कोई अन्य प्रकाशित विषय चुनें या सामग्री अनुमोदित होने के बाद पुनः देखें।`,
    version: 1,
    approved: true,
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Student on-demand Teacher Agent generation (Detailed/Revision Notes first).
  const selectionKey = JSON.stringify([user?.uid, selectedBoard, selectedClass, selectedStream, selectedSubject?.id, selectedChapter?.id, selectedTopic?.id, activeModule, language]);
  const [generationScope] = useState(() => new RequestScope());
  const [generatedScope, setGeneratedScope] = useState('');
  const [rawGeneratedText, setStudentGeneratedText] = useState('');
  const [rawFlashcards, setGeneratedFlashcards] = useState<FlashcardItem[]>([]);
  const [rawMindmap, setGeneratedMindmap] = useState<NonNullable<LearningContent['mindmapNodes']>>([]);
  const studentGeneratedText = generatedScope === selectionKey ? rawGeneratedText : '';
  const generatedFlashcards = generatedScope === selectionKey ? rawFlashcards : [];
  const generatedMindmap = generatedScope === selectionKey ? rawMindmap : [];
  const flashcards = generatedFlashcards.length ? generatedFlashcards : matchedContent?.flashcardItems || [];
  const mindmapNodes = generatedMindmap.length ? generatedMindmap : matchedContent?.mindmapNodes || [];
  const [studentGenerating, setStudentGenerating] = useState(false);
  const [studentGenerationError, setStudentGenerationError] = useState('');
  const [rawDiagramPlans, setStudentDiagramPlans] = useState<Array<{title:string; labels:string[]; instructions:string}>>([]);
  const studentDiagramPlans = generatedScope === selectionKey ? rawDiagramPlans : [];
  const [studentProvenance, setStudentProvenance] = useState<Array<{source?:string; source_url?:string; verification_status?:string}>>([]);

  const subjectStyleProfile = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('physics')) return 'Physics: concept first; precise definitions; formula box with symbols, SI units and conditions; derivation in numbered steps; labelled diagram guidance; solved numerical; common mistakes; board-exam key points.';
    if (n.includes('chemistry')) return 'Chemistry: concept and NCERT terminology; balanced equations/reactions; conditions and observations; tables for comparison; mechanisms/steps where relevant; exceptions; practical examples; board-exam key points.';
    if (n.includes('biology')) return 'Biology: NCERT terminology; definition; structure/process in sequence; labelled-diagram guidance; flowcharts and comparison tables; keywords; common misconceptions; board-answer points.';
    if (n.includes('history')) return 'History: chronological narrative; context/background; timeline; causes; major events and personalities; consequences; key dates/terms; source-based perspective; board-answer structure.';
    if (n.includes('geography')) return 'Geography: concept; spatial context; map/diagram guidance; processes; causes and effects; data/examples; comparison tables; key terminology and board-answer points.';
    if (n.includes('political')) return 'Political Science: concept and constitutional vocabulary; context; institutions/processes; examples; balanced explanation; comparison; key terms; structured board answers.';
    if (n.includes('economics')) return 'Economics: definition; concept; assumptions; formula/graph guidance where relevant; stepwise mechanism; examples; tables; interpretation; common errors; board-answer points.';
    if (n.includes('mathematics') || n.includes('math')) return 'Mathematics: concept; notation; formula/theorem with conditions; stepwise method; worked examples from easy to board level; shortcuts only when valid; common errors; practice cues.';
    if (n.includes('english')) return 'English: clear literary/language analysis; context; theme; character/idea; textual evidence without long quotation; vocabulary; answer-writing framework and concise revision points.';
    return 'Use a clear subject-appropriate CBSE/NCERT academic structure with headings, key terms, examples, exam points and age-appropriate language.';
  };

  const customModule = !DEFAULT_WEBSITE_CONFIG.modules.some(x=>x.id===activeModule);
  const generateWithTeacher = async () => {
    if(customModule){setStudentGenerationError('This module uses admin-published learning material.');return;}
    if (!['Class 9', 'Class 10', 'Class 11', 'Class 12'].includes(selectedClass)) { setStudentGenerationError('AI generation supports Classes IX–XII. Choose admin-published material for other classes.'); return; }
    if (!profile || !user) { openAuthModal('student'); return; }
    if (!selectedSubject || !selectedChapter) return;
    const api = import.meta.env.VITE_SAARTHI_API_URL;
    if (!api) { setStudentGenerationError('Saarthi Teacher service is not configured.'); return; }
    const request = generationScope.start();
    const controller = request.controller;
    let timeout: number | undefined;
    setStudentGenerating(true); setStudentGenerationError('');
    try {
      const token = await user.getIdToken();
      if (!generationScope.owns(request)) return;
      const assetType =
        activeModule === 'revision_notes' ? 'REVISION_NOTES' :
        activeModule === 'formulae' ? 'DEFINITIONS_FORMULAE' :
        activeModule === 'mindmaps' ? 'MIND_MAP' :
        activeModule === 'flashcards' ? 'FLASHCARDS' :
        activeModule === 'cbqs' ? 'COMPETENCY' :
        activeModule === 'case_studies' ? 'CASE_BASED' :
        activeModule === 'test_yourself' ? 'TEST' :
        'DETAILED_NOTES';
      const topic = selectedTopic?.title || selectedChapter.title;
      const topicId = `${selectedSubject.id}:${selectedChapter.id}:${selectedTopic?.id || 'chapter'}`;
      const sample = learningContents.find(x => x.subjectId === selectedSubject.id && x.contentType === 'detailed_notes' && x.approved && x.published && x.bodyText)?.bodyText?.slice(0, 4000) || '';
      timeout = window.setTimeout(() => controller.abort(), 600000);
      const res = await fetch(`${api}/v1/website/teacher/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, signal: controller.signal,
        body: JSON.stringify({
          board: selectedBoard, class_level: selectedClass === 'Class 9' ? 'IX' : selectedClass === 'Class 10' ? 'X' : selectedClass === 'Class 11' ? 'XI' : 'XII',
          subject: selectedSubject.teacherSubject || selectedSubject.name, language: language === 'hi' ? 'HINDI' : 'ENGLISH', asset_type: assetType, topic_id: topicId,
          chapter: selectedChapter.title, topic,
          style_profile: subjectStyleProfile(selectedSubject.name) +
            (assetType === 'FLASHCARDS' ? ' Return ONLY JSON: {"flashcards":[{"question":"...","answer":"...","hint":"..."}]}. Include questionHindi/answerHindi when teaching in Hindi.' : '') +
            (assetType === 'MIND_MAP' ? ' Return ONLY JSON: {"nodes":[{"id":"n1","label":"...","description":"...","children":["n2"]}]}. Each child must reference an existing node id.' : ''), sample_style_reference: sample
        })
      });
      const data = await res.json();
      if (!generationScope.owns(request)) return;
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Sankatmochansaarthi could not generate this material.');
      if (assetType === 'TEST') {
        const questions = parseGeneratedQuestions(data.content || '');
        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        setTestStarted(false); setTestSubmitted(false); setSelectedAnswers({}); setSaveStatus('');
        setGeneratedTest({ id: `generated-${crypto.randomUUID()}`, title: `${topic} — Practice Test`, testType: 'chapter', board: selectedBoard, classGrade: selectedClass, stream: selectedStream, subjectId: selectedSubject.id, chapterId: selectedChapter.id, questions, totalMarks, passingMarks: Math.ceil(totalMarks * 0.8), durationMinutes: Math.max(5, questions.length * 2), approved: false, published: false, createdAt: new Date().toISOString() });
        setStudentGeneratedText('');
      } else if (assetType === 'FLASHCARDS') {
        setGeneratedFlashcards(parseGeneratedFlashcards(data.content || ''));
        setStudentGeneratedText(''); setCurrentFlashcardIndex(0); setIsFlipped(false); setCardMastery({});
      } else if (assetType === 'MIND_MAP') {
        setGeneratedMindmap(parseGeneratedMindmap(data.content || ''));
        setStudentGeneratedText('');
      } else setStudentGeneratedText(data.content || '');
      setGeneratedScope(selectionKey);
      setStudentDiagramPlans(Array.isArray(data.diagram_plans) ? data.diagram_plans : []);
      setStudentProvenance(Array.isArray(data.provenance) ? data.provenance : []);
    } catch (e:any) {
      if (!generationScope.owns(request)) return;
      const msg = e?.name === 'AbortError' ? 'Teacher Agent timed out. Please try again.' : (e?.message === 'Failed to fetch' ? 'Teacher Agent service is unreachable. Backend/model configuration is being checked.' : e?.message);
      setStudentGenerationError(msg || 'Generation failed. Please try again.');
    }
    finally {
      window.clearTimeout(timeout);
      if (generationScope.owns(request)) { setStudentGenerating(false); generationScope.finish(request); }
    }
  };

  const downloadGeneratedNotes = async () => {
    if (!user || user.isAnonymous) { openAuthModal('student'); return; }
    const structured = matchedContent ? [matchedContent.flashcardItems, matchedContent.formulaItems, matchedContent.pyqItems, matchedContent.caseStudyItem, matchedContent.mindmapNodes].filter(Boolean).map(value => JSON.stringify(value, null, 2)).join('\n\n') : '';
    const generatedBody = generatedFlashcards.length ? JSON.stringify({ flashcards: generatedFlashcards }, null, 2) : generatedMindmap.length ? JSON.stringify({ nodes: generatedMindmap }, null, 2) : studentGeneratedText;
    const body = generatedBody || (language === 'hi' ? matchedContent?.bodyHindi || matchedContent?.bodyText : matchedContent?.bodyText) || structured;
    const contentId = !generatedBody && matchedContent?.attachmentType === 'application/pdf' && matchedContent.storagePath ? matchedContent.id : undefined;
    if (!body && !contentId) { setStudentGenerationError('This material has no readable notes to save yet.'); return; }
    try {
      const key = `${selectedBoard}:${selectedClass}:${selectedSubject?.id}:${selectedChapter?.id}:${selectedTopic?.id || ''}:${activeModule}:${language}`;
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
      const id = Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
      const material = prepareSavedMaterial({ id, title: contentId ? matchedContent!.title : `${selectedSubject?.name || 'Saarthi'}: ${selectedChapter?.title || 'Notes'} — ${activeModule.replaceAll('_', ' ')}`, body: contentId ? '' : body, ...(contentId ? { contentId } : {}), curriculum: [selectedBoard, selectedClass, selectedSubject?.name || '', selectedChapter?.title || ''].join(' · '), savedAt: new Date().toISOString() });
      await setDoc(doc(db, 'users', user.uid, 'saved_materials', id), material);
      setStudentGenerationError('Saved to My Dashboard — Saved Materials.');
    } catch (error) {
      setStudentGenerationError(error instanceof Error ? error.message : 'Unable to save material. Please try again.');
    }
  };


  // State for Flashcards
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const flashcardIndex = Math.min(currentFlashcardIndex, Math.max(0, flashcards.length - 1));
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardMastery, setCardMastery] = useState<Record<string, 'mastered' | 'review'>>({});

  // State for Copy Formula Feedback
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // State for Test Yourself
  const matchedTests = evaluationTests.filter((t) => {
    if(t.board!==selectedBoard || t.classGrade!==selectedClass || !t.approved || !t.published)return false;
    if (t.subjectId !== selectedSubject?.id) return false;
    if (selectedChapter && t.chapterId && t.chapterId !== selectedChapter.id) return false;
    return true;
  });

  // Never serve an unrelated fallback test from another subject/chapter.
  const [generatedTest, setGeneratedTest] = useState<EvaluationTest>();
  const testCandidate = (generatedScope === selectionKey ? generatedTest : undefined) || matchedTests[0];
  const activeTest: EvaluationTest | undefined = testCandidate ? { ...testCandidate, totalMarks: testCandidate.questions.reduce((sum, q) => sum + q.marks, 0) } : undefined;
  const submitting = useRef(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Reset interactive module state whenever curriculum/module selection changes.
  useEffect(() => {
    generationScope.invalidate();
    setStudentGenerating(false);
    setGeneratedScope(''); setGeneratedFlashcards([]); setGeneratedMindmap([]);
    setStudentDiagramPlans([]); setCardMastery({});
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    setTestStarted(false);
    setTestSubmitted(false);
    setGeneratedTest(undefined);
    setSaveStatus('');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmittedScorecard(null);
    setStudentGeneratedText('');
    setStudentGenerationError('');
    setStudentProvenance([]);
    return () => generationScope.invalidate();
  }, [selectionKey]);

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
    if (testStarted && !testSubmitted && testTimeRemaining <= 0) {
      void handleAutoSubmit();
      return;
    }
    if (testStarted && !testSubmitted && testTimeRemaining > 0) {
      interval = setInterval(() => {
        setTestTimeRemaining((prev) => {
          return Math.max(0, prev - 1);
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
    if (!activeTest || submitting.current) return;
    submitting.current = true;
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
        options: [...q.options],
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
      setSaveStatus('Saving result and Mistake Book…');
      await saveTestResult(resultPayload);
      setSaveStatus('Result and Mistake Book saved.');
    } catch (err) {
      setSaveStatus('Your score is shown, but the result could not be saved. Check your connection before leaving this page.');
    } finally { submitting.current = false; }
  };

  const handleCopyFormula = (id: string, formula: string) => {
    setStudentGenerationError('Read formulas inside your dashboard. Copying is disabled.');
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-4 sm:p-6 flex flex-col min-w-0">
      {/* Module Title Header */}
      <div className="border-b border-orange-100 pb-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
              {optionLabel(config.modules,activeModule,language)}
            </span>
            <span className="text-xs text-stone-500 font-semibold">
              {optionLabel(config.boards,selectedBoard,language)} • {optionLabel(config.classes,selectedClass,language)} • {selectedSubject?.name}
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-stone-900 font-cinzel mt-1">
            {language === 'hi' ? displayContent.hindiTitle || displayContent.title : displayContent.title}
          </h2>

          {selectedChapter && (
            <p className="text-xs text-orange-700 font-medium mt-0.5"><WebsiteText original={"Chapter "} />{selectedChapter.chapterNumber}: {selectedChapter.title}
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
            if (!videos.length) return <div className="p-6 text-center border border-dashed border-orange-300 rounded-2xl text-sm text-stone-600"><WebsiteText original={"No Saarthi Recommended Video has been published for this selection yet."} /></div>;
            return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{videos.map(v => (
              <div key={v.id} className="border border-red-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="aspect-video bg-black">
                  <iframe src={`https://www.youtube.com/embed/${v.youtubeId}?rel=0&modestbranding=1&playsinline=1`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full border-0" />
                </div>
                <div className="p-3">
                  <div className="flex items-start gap-2"><Youtube className="w-5 h-5 text-red-600 shrink-0"/><div><h3 className="font-bold text-sm text-stone-900">{v.title}</h3><p className="text-[11px] text-stone-500 mt-0.5">{v.channelTitle}{v.topicTitle ? ` • ${v.topicTitle}` : ''}{v.subtopicTitle ? ` → ${v.subtopicTitle}` : ''}</p></div></div>
                  <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:underline"><Play className="w-3.5 h-3.5"/><WebsiteText original={"Watch on YouTube"} /><ExternalLink className="w-3 h-3"/></a>
                </div>
              </div>
            ))}</div>;
          })()}
        </div>
      )}

      {customModule && <section className="space-y-3">
        <p className="whitespace-pre-wrap break-words">{language==='hi' ? displayContent.bodyHindi || displayContent.bodyText : displayContent.bodyText}</p>
        {hasPublishedModuleContent && <button className="border rounded-xl px-3 py-2 text-sm" onClick={downloadGeneratedNotes}>Save to My Dashboard</button>}
        {studentGenerationError && <p role="alert">{studentGenerationError}</p>}
      </section>}
      {matchedContent?.storagePath && matchedContent.attachmentType === 'application/pdf' ? <Suspense fallback={<p role="status">Opening PDF reader…</p>}><StudyPdfReader key={matchedContent.id} contentId={matchedContent.id} /></Suspense> : matchedContent?.attachmentUrl && <p className="border rounded-xl p-3 text-sm">{matchedContent.attachmentName || 'Study file'} — ask Admin to replace this file with a branded PDF.</p>}
      {hasPublishedModuleContent && !customModule && <button className="border rounded-xl px-3 py-2 text-sm mb-3" onClick={downloadGeneratedNotes}>Save to My Dashboard</button>}

      {/* Module 1 & 2: Detailed Notes & Revision Notes */}
      {(activeModule === 'detailed_notes' || activeModule === 'revision_notes') && (
        <div className="space-y-4 select-none" onCopy={(e)=>e.preventDefault()} onCut={(e)=>e.preventDefault()} onContextMenu={(e)=>e.preventDefault()}>
          <div className="flex flex-wrap items-center gap-2 justify-between bg-orange-50 border border-orange-200 rounded-2xl p-3">
            <div><div className="font-bold text-sm text-orange-950"><WebsiteText original={"Saarthi Teacher Agent"} /></div><div className="text-[11px] text-stone-600"><WebsiteText original={"Generate this material for your selected chapter/topic and language."} /></div></div>
            <div className="flex gap-2">
              <button onClick={generateWithTeacher} disabled={studentGenerating} className="px-3 py-2 rounded-xl bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"><WandSparkles className="w-4 h-4"/>{studentGenerating ? websiteText("Generating…") : websiteText("Generate with Sankatmochansaarthi")}</button>
              {studentGeneratedText && <button onClick={downloadGeneratedNotes} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5"><Download className="w-4 h-4"/><WebsiteText original={"Save to My Dashboard"} /></button>}
            </div>
          </div>
          {studentGenerationError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">{studentGenerationError}</div>}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 font-serif leading-relaxed flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                {language === 'hi'
                  ? matchedContent?.approved && matchedContent?.published
                    ? websiteText("संकटमोचन सत्यापित सामग्री: अनुमोदित शैक्षणिक सामग्री प्रकाशित है।")
                    : websiteText("इस चयन के लिए सत्यापित सामग्री अभी प्रकाशित नहीं हुई है।")
                  : matchedContent?.approved && matchedContent?.published
                    ? websiteText("Sankatmochan Verified: Published academic content.")
                    : websiteText("No verified content has been published for this selection yet.")}
              </span>
            </span>
          </div>

          <div className="prose prose-stone max-w-none text-stone-800 leading-relaxed text-sm sm:text-base space-y-4 whitespace-pre-line bg-gradient-to-b from-stone-50/50 to-white p-5 rounded-2xl border border-stone-200/70 font-sans">
            {studentGeneratedText || (language === 'hi' && displayContent.bodyHindi
              ? displayContent.bodyHindi
              : displayContent.bodyText)}
          </div>
          {studentDiagramPlans.length > 0 && <section aria-label="Diagram guidance" className="space-y-3">
            <h3 className="font-bold text-sm">{websiteText('Diagram guidance — illustration not generated')}</h3>
            {studentDiagramPlans.map((plan, index) => <article key={index} className="rounded-xl border bg-sky-50 p-4">
              <h4 className="font-bold">{plan.title}</h4>
              <p className="text-sm whitespace-pre-wrap mt-2">{plan.instructions}</p>
              <p className="text-xs mt-2">{websiteText('Labels:')} {(plan.labels || []).join(', ')}</p>
            </article>)}
          </section>}
        </div>
      )}

      {/* Module 3: Definitions & Formulae */}
      {activeModule === 'formulae' && (
        <div className="space-y-4 select-none" onCopy={(e)=>e.preventDefault()} onCut={(e)=>e.preventDefault()} onContextMenu={(e)=>e.preventDefault()}>
          <div className="flex flex-wrap gap-2 justify-end"><button onClick={generateWithTeacher} disabled={studentGenerating} className="px-3 py-2 rounded-xl bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"><WandSparkles className="w-4 h-4"/>{studentGenerating ? websiteText("Generating…") : websiteText("Generate with Sankatmochansaarthi")}</button>{studentGeneratedText && <button onClick={downloadGeneratedNotes} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5"><Download className="w-4 h-4"/><WebsiteText original={"Save to My Dashboard"} /></button>}</div>
          {studentGenerationError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">{studentGenerationError}</div>}
          {studentGeneratedText && <div className="whitespace-pre-line bg-stone-50 border border-stone-200 rounded-2xl p-5 text-sm leading-relaxed">{studentGeneratedText}</div>}
          {!hasPublishedModuleContent || !(displayContent.formulaItems?.length) ? (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200"><WebsiteText original={"No verified definitions or formulae have been published for this selection yet."} /></div>
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
                    title={websiteText("Copy Formula")}
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
                    <span className="font-semibold text-orange-800"><WebsiteText original={"Units:"} /></span> {item.units}
                  </div>
                )}
                {item.application && (
                  <div className="mt-1 text-[11px] text-stone-600">
                    <span className="font-semibold text-orange-800"><WebsiteText original={"Use:"} /></span> {item.application}
                  </div>
                )}
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* Actual concept nodes and their stored relationships. */}
      {activeModule === 'mindmaps' && <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={generateWithTeacher} disabled={studentGenerating} className="rounded-xl bg-orange-600 px-3 py-2 text-white text-xs font-bold disabled:opacity-50">{websiteText(studentGenerating ? 'Generating…' : 'Generate with Sankatmochansaarthi')}</button>
          {generatedMindmap.length > 0 && <button onClick={downloadGeneratedNotes} className="border rounded-xl px-3 py-2 text-xs">{websiteText('Save to My Dashboard')}</button>}
        </div>
        {studentGenerationError && <p role="alert" className="text-sm text-red-700">{studentGenerationError}</p>}
        {!mindmapNodes.length ? <p className="rounded-xl border p-4 text-sm">{websiteText('No verified mind map has been published for this selection yet.')}</p> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {mindmapNodes.map(node => <article key={node.id} className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <h3 className="font-bold text-purple-900">{node.label}</h3>
            <p className="text-sm whitespace-pre-wrap mt-2">{node.description}</p>
            {!!node.children?.length && <div className="mt-3 border-t pt-2 text-xs"><span className="font-semibold">{websiteText('Connects to:')}</span><ul className="list-disc pl-4">{node.children.map(id => <li key={id}>{mindmapNodes.find(child => child.id === id)?.label || id}</li>)}</ul></div>}
          </article>)}
        </div>}
      </section>}

      {/* Module 5: Interactive Flashcards */}
      {activeModule === 'flashcards' && (
        <div className="space-y-4 max-w-xl mx-auto w-full select-none" onCopy={(e)=>e.preventDefault()} onCut={(e)=>e.preventDefault()} onContextMenu={(e)=>e.preventDefault()}>
          <div className="flex flex-wrap gap-2 justify-end"><button onClick={generateWithTeacher} disabled={studentGenerating} className="px-3 py-2 rounded-xl bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"><WandSparkles className="w-4 h-4"/>{studentGenerating ? websiteText("Generating…") : websiteText("Generate with Sankatmochansaarthi")}</button>{generatedFlashcards.length > 0 && <button onClick={downloadGeneratedNotes} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5"><Download className="w-4 h-4"/><WebsiteText original={"Save to My Dashboard"} /></button>}</div>
          {studentGenerationError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">{studentGenerationError}</div>}
          {studentGeneratedText && <div className="whitespace-pre-line bg-amber-50 border border-orange-200 rounded-2xl p-5 text-sm leading-relaxed">{studentGeneratedText}</div>}
          {flashcards && flashcards.length > 0 ? (
            <div>
              {/* Counter & Controls */}
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span><WebsiteText original={"Card "} />{flashcardIndex + 1}<WebsiteText original={" of "} />{flashcards.length}
                </span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold"><WebsiteText original={"Click card to flip"} /></span>
              </div>

              {/* Flashcard Body */}
              {(() => {
                const card = flashcards[flashcardIndex];
                return (
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer min-h-[220px] sm:min-h-[260px] bg-gradient-to-br from-amber-50 to-orange-100/60 border-2 border-orange-300 hover:border-orange-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg transition-all transform hover:-translate-y-0.5 select-none relative"
                  >
                    <div className="flex items-center justify-between text-xs text-orange-800 font-bold uppercase tracking-wider">
                      <span>{isFlipped ? websiteText("Answer / Solution") : websiteText("Question / Recall Prompt")}</span>
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
                        <p className="text-xs text-stone-500 italic mt-3"><WebsiteText original={"Hint: "} />{card.hint}</p>
                      )}
                    </div>

                    <div className="text-center text-[11px] text-stone-400">
                      {isFlipped ? websiteText("Tap to see question again") : websiteText("Tap to reveal answer")}
                    </div>
                  </div>
                );
              })()}

              {/* Navigation and Mastery Buttons */}
              <div className="flex items-center justify-between gap-3 mt-4">
                <button
                  disabled={flashcardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentFlashcardIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="px-4 py-2 bg-stone-100 disabled:opacity-40 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /><WebsiteText original={" Previous"} /></button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const id = flashcards![flashcardIndex].id;
                      setCardMastery((prev) => ({ ...prev, [id]: 'mastered' }));
                      if (flashcardIndex < flashcards!.length - 1) {
                        setIsFlipped(false);
                        setCurrentFlashcardIndex((prev) => prev + 1);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /><WebsiteText original={" Got It"} /></button>
                  <button
                    onClick={() => {
                      const id = flashcards![flashcardIndex].id;
                      setCardMastery((prev) => ({ ...prev, [id]: 'review' }));
                      if (flashcardIndex < flashcards!.length - 1) {
                        setIsFlipped(false);
                        setCurrentFlashcardIndex((prev) => prev + 1);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm"
                  ><WebsiteText original={"Needs Review"} /></button>
                </div>

                <button
                  disabled={flashcardIndex === flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentFlashcardIndex((prev) =>
                      Math.min(flashcards!.length - 1, prev + 1)
                    );
                  }}
                  className="px-4 py-2 bg-stone-100 disabled:opacity-40 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-1"
                ><WebsiteText original={"Next "} /><ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200"><WebsiteText original={"No verified flashcards have been published for this selection yet."} /></div>
          )}
        </div>
      )}

      {/* Module 6: Previous Year Questions (PYQs) */}
      {activeModule === 'pyqs' && (
        <div className="space-y-4">
          {!(displayContent.pyqItems?.length) && <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200"><WebsiteText original={"No verified previous-year questions have been published for this selection yet."} /></div>}
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
                    [{item.marks} {item.marks === 1 ? websiteText("Mark") : websiteText("Marks")}]
                  </span>
                </div>
                {item.repeatedFrequency && (
                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                    ★ {item.repeatedFrequency}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug"><WebsiteText original={"Q"} />{idx + 1}. {language === 'hi' && item.questionHindi ? item.questionHindi : item.question}
              </h4>

              <div className="mt-3 bg-amber-50/50 border border-orange-200/60 rounded-xl p-3.5 text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed font-sans">
                <span className="font-bold text-orange-900 block mb-1 text-xs uppercase tracking-wide"><WebsiteText original={"Model Solution & Marking Points:"} /></span>
                {language === 'hi' && item.solutionHindi ? item.solutionHindi : item.solution}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module 7 & 8: Competency-Based Questions (CBQs) & Case-Based Studies */}
      {(activeModule === 'cbqs' || activeModule === 'case_studies') && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 justify-end"><button onClick={generateWithTeacher} disabled={studentGenerating} className="px-3 py-2 rounded-xl bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"><WandSparkles className="w-4 h-4"/>{studentGenerating ? websiteText("Generating…") : websiteText("Generate with Sankatmochansaarthi")}</button></div>
          {studentGenerationError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">{studentGenerationError}</div>}
          {studentGeneratedText && <div className="whitespace-pre-line bg-teal-50 border border-teal-200 rounded-2xl p-5 text-sm leading-relaxed">{studentGeneratedText}</div>}
          {studentGeneratedText && studentProvenance.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 text-xs text-stone-600">
              <div className="font-bold text-stone-800 mb-2"><WebsiteText original={"Verified sources used"} /></div>
              {studentProvenance.map((source, idx) => (
                <div key={idx} className="mb-1 break-all">
                  {source.source_url ? <a className="text-blue-700 underline" href={source.source_url} target="_blank" rel="noreferrer">{source.source || source.source_url}</a> : <span>{source.source || 'Sankatmochansaarthi Internal Knowledge Base'}</span>}
                  {source.verification_status && <span className="ml-2 text-emerald-700 font-semibold">({source.verification_status})</span>}
                </div>
              ))}
            </div>
          )}
          {displayContent.caseStudyItem ? (
            <div className="bg-gradient-to-br from-teal-50/40 via-amber-50/20 to-orange-50/30 border border-teal-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"><WebsiteText original={"Case Study Passage"} /></span>
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
                      <span className="font-bold"><WebsiteText original={"Correct Key: "} /></span><WebsiteText original={" Option "} />{String.fromCharCode(65 + q.correctIndex)} — {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-orange-200 p-5 rounded-2xl text-xs sm:text-sm text-stone-700">
              <h4 className="font-bold text-orange-900 mb-1">{activeModule === 'cbqs' ? websiteText("Competency-Based Questions") : websiteText("Case-Based Study")}</h4>
              <p><WebsiteText original={"No verified "} />{activeModule === 'cbqs' ? websiteText("competency-based questions") : websiteText("case-based study")}<WebsiteText original={" have been published for this selection yet."} /></p>
            </div>
          )}
        </div>
      )}

      {/* Module 9: Test Yourself (Interactive Objective Testing Engine) */}
      {activeModule === 'test_yourself' && (
        <div className="space-y-5">
          {saveStatus && <p role="status" className="p-3 border rounded-xl">{saveStatus}</p>}
          <div className="flex flex-wrap gap-2 justify-end"><button onClick={generateWithTeacher} disabled={studentGenerating} className="px-3 py-2 rounded-xl bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"><WandSparkles className="w-4 h-4"/>{studentGenerating ? websiteText("Generating…") : websiteText("Generate Test with Sankatmochansaarthi")}</button></div>
          {studentGenerationError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">{studentGenerationError}</div>}
          {studentGeneratedText && <div className="whitespace-pre-line bg-stone-50 border border-stone-200 rounded-2xl p-5 text-sm leading-relaxed">{studentGeneratedText}</div>}
          {!activeTest && (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200"><WebsiteText original={"No published test is available for this subject/chapter selection yet."} /></div>
          )}
          {activeTest && !testStarted && !testSubmitted && (
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white border-2 border-orange-300 rounded-3xl p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-md">
              <CheckSquare className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-cinzel">
                {activeTest?.title || 'Interactive Assessment Test'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-lg mx-auto"><WebsiteText original={"Test your knowledge under timed exam conditions. Instant automatic evaluation, question-by-question explanations, and automatic addition of any wrong answers to your personal "} /><strong><WebsiteText original={"Mistake Book"} /></strong>!
              </p>

              <div className="grid grid-cols-3 gap-3 my-6 text-xs max-w-md mx-auto">
                <div className="bg-white border border-orange-200 p-3 rounded-2xl shadow-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold"><WebsiteText original={"Questions"} /></span>
                  <span className="text-lg font-black text-stone-800">
                    {activeTest?.questions.length || 5}
                  </span>
                </div>
                <div className="bg-white border border-orange-200 p-3 rounded-2xl shadow-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold"><WebsiteText original={"Duration"} /></span>
                  <span className="text-lg font-black text-orange-600">
                    {activeTest?.durationMinutes || 15}<WebsiteText original={" Mins"} /></span>
                </div>
                <div className="bg-white border border-orange-200 p-3 rounded-2xl shadow-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold"><WebsiteText original={"Marks"} /></span>
                  <span className="text-lg font-black text-stone-800">
                    {activeTest?.totalMarks || 10}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartTest}
                className="py-3 px-8 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                {language === 'hi' ? websiteText("परीक्षा प्रारंभ करें") : websiteText("Start Test Now")}
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
                    {activeTest.testType}<WebsiteText original={" Test"} /></span>
                  <span className="text-stone-400 text-xs"><WebsiteText original={"| Question "} />{currentQuestionIndex + 1}<WebsiteText original={" of "} />{activeTest.questions.length}</span>
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
                      <h4 className="font-bold text-stone-900 text-base sm:text-lg leading-snug"><WebsiteText original={"Q"} />{currentQuestionIndex + 1}. {language === 'hi' && q.questionHindi ? q.questionHindi : q.questionText}
                      </h4>
                      <span className="bg-orange-100 text-orange-900 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        {q.marks} {q.marks === 1 ? websiteText("Mark") : websiteText("Marks")}
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
                                ? "bg-orange-500 text-white border-orange-600 shadow-md font-bold"
                                : "bg-stone-50 hover:bg-orange-50/60 text-stone-800 border-stone-200"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isChosen
                                  ? "bg-white text-orange-600"
                                  : "bg-white border border-stone-300 text-stone-600"
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
                  <ChevronLeft className="w-4 h-4" /><WebsiteText original={" Previous"} /></button>

                {currentQuestionIndex < activeTest.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                  ><WebsiteText original={"Next Question "} /><ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleAutoSubmit}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /><WebsiteText original={" Submit Test"} /></button>
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

                <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-white/20 px-3 py-1 rounded-full"><WebsiteText original={"Test Evaluation Report Card"} /></span>

                <h3 className="text-2xl sm:text-3xl font-black font-cinzel mt-3"><WebsiteText original={"Score: "} />{submittedScorecard.score} / {submittedScorecard.totalMarks}
                </h3>
                <p className="text-amber-100 font-bold text-sm sm:text-base mt-1"><WebsiteText original={"Percentage: "} />{submittedScorecard.percentage}<WebsiteText original={"% • Accuracy: "} />{submittedScorecard.accuracy}%
                </p>

                <p className="text-xs sm:text-sm text-white/95 mt-3 max-w-lg mx-auto bg-black/20 p-3 rounded-2xl border border-white/20 italic font-serif">
                  "{submittedScorecard.remarks}"
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-5 text-xs">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <span className="block font-bold text-amber-200"><WebsiteText original={"Strengths"} /></span>
                    <span>{submittedScorecard.strengths.join(', ')}</span>
                  </div>
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <span className="block font-bold text-amber-200"><WebsiteText original={"Focus Areas"} /></span>
                    <span>{submittedScorecard.weaknesses.join(', ')}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleStartTest}
                    className="px-5 py-2 bg-white text-orange-900 font-bold rounded-xl text-xs shadow-md hover:bg-amber-50 transition-colors"
                  ><WebsiteText original={"Retry Test"} /></button>
                </div>
              </div>

              {/* Question by Question Detailed Review */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-base text-stone-900 font-cinzel"><WebsiteText original={"Detailed Question Analysis & Explanations:"} /></h4>

                {submittedScorecard.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${
                      ans.isCorrect
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-red-50/50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-stone-700"><WebsiteText original={"Question "} />{idx + 1}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          ans.isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ans.isCorrect ? websiteText("Correct (+1)") : websiteText("Saved to Mistake Book")}
                      </span>
                    </div>

                    <p className="font-semibold text-xs sm:text-sm text-stone-900 mb-2">
                      {ans.questionText}
                    </p>

                    <div className="text-xs space-y-1 text-stone-700">
                      <div><WebsiteText original={"Your Answer:"} />{' '}
                        <span className="font-bold">
                          {ans.selectedOption >= 0
                            ? `Option ${String.fromCharCode(65 + ans.selectedOption)}`
                            : websiteText("Not Attempted")}
                        </span>
                      </div>
                      <div><WebsiteText original={"Correct Answer:"} />{' '}
                        <span className="font-bold text-emerald-700"><WebsiteText original={"Option "} />{String.fromCharCode(65 + ans.correctOption)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-200/60 text-xs text-stone-600 bg-white p-2.5 rounded-xl">
                      <span className="font-bold text-orange-900"><WebsiteText original={"Explanation: "} /></span>
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

