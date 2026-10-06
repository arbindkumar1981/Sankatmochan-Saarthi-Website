import { useWebsite } from '../context/WebsiteContext';
import { activeOptions } from '../services/websiteConfig';
import { subjectsForSelection } from '../services/adminValidation';
import { WebsiteSettingsManager } from './WebsiteSettingsManager';
import { CurriculumManager } from './CurriculumManager';
import { ManagedRecords } from './ManagedRecords';
import React, { useEffect, useMemo, useState } from 'react';
import { uploadBrandedStudyFile } from '../services/studyFileUpload';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useCurriculum } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import {
  LearningContent,
  YouTubeVideoItem,
  EvaluationTest,
  NoticeItem,
  ContactEnquiry,
  UserProfile,
  ContentModuleType,
  BoardType,
  ClassGrade,
  StreamType
} from '../types';
import {
  ShieldCheck,
  Users,
  BookOpen,
  FileText,
  Youtube,
  CheckSquare,
  BellRing,
  Inbox,
  Plus,
  Check,
  X,
  Trash2,
  Edit,
  Eye,
  Archive,
  Image as ImageIcon,
  Save,
  Sparkles,
  Search,
  Upload,
  Paperclip
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { config } = useWebsite();
  const {
    learningContents,
    deletedAssetIds,
    youtubeVideos,
    evaluationTests,
    notices,
    testResults,
    addNewLearningContent,
    updateContentApproval,
    addNewVideo,
    addNewTest,
    addNewNotice,
    babaImageUrl,
    selectedBoard,
    selectedClass,
    selectedStream,
    selectedSubject,
    availableSubjects,
    curriculumSubjects,
    saveCurriculumSubject,
    language
  } = useCurriculum();

  const { profile, user } = useAuth();

  const [adminTab, setAdminTab] = useState<
    'content' | 'videos' | 'tests' | 'notices' | 'students' | 'enquiries' | 'settings' | 'curriculum'
  >('settings');

  const [adminOperationError, setAdminOperationError] = useState('');
  const adminSubmit = (action: (e: React.FormEvent) => Promise<void>) => async (e: React.FormEvent) => {
    e.preventDefault(); setAdminOperationError('');
    try { await action(e); } catch { setAdminOperationError('Changes were not saved. Check administrator access, connectivity and the form details, then try again.'); }
  };
  const approveContent = async (id: string, approved: boolean, published: boolean) => {
    setAdminOperationError('');
    try { await updateContentApproval(id,approved,published); } catch { setAdminOperationError('Approval was not saved. Restore deleted items in the manager first.'); }
  };

  // New Content Form State
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentTitle, setContentTitle] = useState('');
  const [contentHindiTitle, setContentHindiTitle] = useState('');
  const [contentType, setContentType] = useState<ContentModuleType>('detailed_notes');
  const [contentBody, setContentBody] = useState('');
  const [contentHindiBody, setContentHindiBody] = useState('');
  const [contentBoard, setContentBoard] = useState<BoardType>(selectedBoard);
  const [contentClass, setContentClass] = useState<ClassGrade>(selectedClass);
  const [contentStream, setContentStream] = useState<StreamType>(selectedStream);
  const [contentSubjectId, setContentSubjectId] = useState(selectedSubject?.id || '');
  const [contentChapterId, setContentChapterId] = useState(selectedSubject?.chapters[0]?.id || '');
  const [contentTopicId, setContentTopicId] = useState('');
  const [contentTopicTitle, setContentTopicTitle] = useState('');
  const [contentSubtopic, setContentSubtopic] = useState('');
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentUploadStatus, setContentUploadStatus] = useState('');
  const [contentGenerating, setContentGenerating] = useState(false);
  const [contentError, setContentError] = useState('');

  const formSubjects = useMemo(() => subjectsForSelection(curriculumSubjects,contentBoard,contentClass,contentStream), [curriculumSubjects,contentBoard,contentClass,contentStream]);
  const formSubject = formSubjects.find(s => s.id === contentSubjectId) || formSubjects[0] || null;
  const formChapter = formSubject?.chapters.find(ch => ch.id === contentChapterId) || formSubject?.chapters[0] || null;

  const uploadTopicChoices = [...new Set([...(formChapter?.topics.map(t => t.title) || []), ...learningContents.filter(c => c.board === contentBoard && c.classGrade === contentClass && c.subjectId === formSubject?.id && c.chapterId === formChapter?.id && c.status !== 'ARCHIVED' && !deletedAssetIds.has(`learning_contents/${c.id}`)).map(c => c.topicTitle || '').filter(Boolean)])];
  const uploadSubtopicChoices = [...new Set(learningContents.filter(c => c.board === contentBoard && c.classGrade === contentClass && c.subjectId === formSubject?.id && c.chapterId === formChapter?.id && c.topicTitle === contentTopicTitle && c.status !== 'ARCHIVED' && !deletedAssetIds.has(`learning_contents/${c.id}`)).map(c => c.subtopicTitle || '').filter(Boolean))];

  // New Video Form State
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoYoutubeId, setVideoYoutubeId] = useState('');
  const [videoChannel, setVideoChannel] = useState('Sankatmochan Academy');
  const [videoDuration, setVideoDuration] = useState('35:00');
  const [videoBoard, setVideoBoard] = useState<BoardType>(selectedBoard);
  const [videoClass, setVideoClass] = useState<ClassGrade>(selectedClass);
  const [videoStream, setVideoStream] = useState<StreamType>(selectedStream);
  const [videoSubjectId, setVideoSubjectId] = useState('');
  const [videoChapterId, setVideoChapterId] = useState('');
  const [videoTopic, setVideoTopic] = useState('');
  const [videoSubtopic, setVideoSubtopic] = useState('');
  const videoSubjects = subjectsForSelection(curriculumSubjects,videoBoard,videoClass,videoStream);
  const videoSubject = videoSubjects.find(s => s.id === videoSubjectId) || videoSubjects[0] || null;
  const videoChapter = videoSubject?.chapters.find(ch => ch.id === videoChapterId) || videoSubject?.chapters[0] || null;

  // New Assessment Test Form State
  const [showTestForm, setShowTestForm] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testBoard, setTestBoard] = useState<BoardType>(selectedBoard);
  const [testClass, setTestClass] = useState<ClassGrade>(selectedClass);
  const [testStream, setTestStream] = useState<StreamType>(selectedStream);
  const [testSubjectId, setTestSubjectId] = useState('');
  const [testChapterId, setTestChapterId] = useState('');
  const [testQuestionText, setTestQuestionText] = useState('');
  const [testOptionsText, setTestOptionsText] = useState('');
  const [testCorrectIndex, setTestCorrectIndex] = useState(0);
  const [testExplanation, setTestExplanation] = useState('');
  const testSubjects = subjectsForSelection(curriculumSubjects,testBoard,testClass,testStream);
  const testSubject = testSubjects.find(s => s.id === testSubjectId) || testSubjects[0] || null;
  const testChapter = testSubject?.chapters.find(ch => ch.id === testChapterId) || testSubject?.chapters[0] || null;

  useEffect(() => {
    const boards=activeOptions(config.boards), classes=activeOptions(config.classes), streams=activeOptions(config.streams);
    if(!boards.some(x=>x.id===contentBoard))setContentBoard(boards[0].id);
    if(!boards.some(x=>x.id===videoBoard))setVideoBoard(boards[0].id);
    if(!boards.some(x=>x.id===testBoard))setTestBoard(boards[0].id);
    if(!classes.some(x=>x.id===contentClass))setContentClass(classes[0].id);
    if(!classes.some(x=>x.id===videoClass))setVideoClass(classes[0].id);
    if(!classes.some(x=>x.id===testClass))setTestClass(classes[0].id);
    if(!streams.some(x=>x.id===contentStream))setContentStream(streams[0].id);
    if(!streams.some(x=>x.id===videoStream))setVideoStream(streams[0].id);
    if(!streams.some(x=>x.id===testStream))setTestStream(streams[0].id);
  }, [config, contentBoard, videoBoard, testBoard, contentClass, videoClass, testClass, contentStream, videoStream, testStream]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const options = testOptionsText.split('\n').map(x => x.trim()).filter(Boolean);
    if (!testTitle.trim() || !testSubject || !testChapter || !testQuestionText.trim() || options.length < 2 || testCorrectIndex >= options.length) return;
    await addNewTest({
      title: testTitle.trim(), testType: 'chapter', board: testBoard, classGrade: testClass, stream: testStream,
      subjectId: testSubject.id, chapterId: testChapter.id, durationMinutes: 15, totalMarks: 1, passingMarks: 1,
      questions: [{ id: 'q-' + Date.now(), questionText: testQuestionText.trim(), options, correctIndex: testCorrectIndex, explanation: testExplanation.trim() || 'Review the correct option.', marks: 1 }],
      approved: true, published: true, createdAt: new Date().toISOString()
    });
    setTestTitle(''); setTestQuestionText(''); setTestOptionsText(''); setTestCorrectIndex(0); setTestExplanation(''); setShowTestForm(false);
  };

  // New Notice Form State
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeHindiTitle, setNoticeHindiTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeHindiMessage, setNoticeHindiMessage] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'motivational' | 'academic' | 'urgent'>('motivational');
  const [noticeQuote, setNoticeQuote] = useState('');

  // Admin inbox is authoritative from Firestore; localStorage is only an offline fallback.
  const [enquiriesList, setEnquiriesList] = useState<ContactEnquiry[]>([]);
  useEffect(() => {
    const localFallback = JSON.parse(localStorage.getItem('saarthi_enquiries') || '[]') as ContactEnquiry[];
    const unsub = onSnapshot(collection(db, 'enquiries'), snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactEnquiry))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      const remoteIds = new Set(remote.map(e => e.id));
      setEnquiriesList([...remote, ...localFallback.filter(e => !remoteIds.has(e.id))]);
    }, () => setEnquiriesList(localFallback));
    return () => unsub();
  }, []);

  // Live registered-student directory and cross-student result history for administrators.
  const [registeredStudents, setRegisteredStudents] = useState<UserProfile[]>([]);
  const [allStudentResults, setAllStudentResults] = useState<any[]>([]);
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setRegisteredStudents(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)).filter(p => p.role !== 'admin'));
    }, err => console.warn('Student directory sync failed:', err.message));
    const unsubResults = onSnapshot(collection(db, 'test_results'), snap => {
      setAllStudentResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.warn('Admin result history sync failed:', err.message));
    return () => { unsubUsers(); unsubResults(); };
  }, []);

  const classRoman = (grade: ClassGrade) => (({ 'Class 9': 'IX', 'Class 10': 'X', 'Class 11': 'XI', 'Class 12': 'XII' } as Record<string, string>)[grade]);

  const handleGenerateDetailedNotes = async () => {
    setContentError('');
    if (!formSubject || !formChapter) { setContentError('Select Subject and Chapter first.'); return; }
    if (!['Class 9', 'Class 10', 'Class 11', 'Class 12'].includes(contentClass)) { setContentError('AI generation supports Classes IX–XII. Publish material manually for other classes.'); return; }
    if (contentBoard !== 'CBSE') { setContentError('Teacher Agent generation currently supports CBSE only.'); return; }
    if (!user) { setContentError('Admin login is required.'); return; }
    const apiBase = (import.meta.env.VITE_SAARTHI_API_URL || '').replace(/\/$/, '');
    if (!apiBase) { setContentError('Saarthi backend URL is not configured.'); return; }
    const concept = contentSubtopic.trim() || contentTopicTitle.trim() || formChapter.title;
    const topicId = (contentTopicTitle.trim() || formChapter.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,70) || formChapter.id;
    setContentGenerating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${apiBase}/v1/website/teacher/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          board: 'CBSE', class_level: classRoman(contentClass),
          subject: formSubject.teacherSubject || formSubject.name,
          language: language === 'hi' ? 'HINDI' : 'ENGLISH',
          asset_type: 'DETAILED_NOTES', topic_id: topicId,
          knowledge: {
            knowledge_id: `admin-${topicId}-${Date.now()}`, topic_id: topicId, concept,
            facts: [`Create curriculum-aligned detailed notes for ${formSubject.name}, ${formChapter.title}${contentTopicTitle.trim() ? ', topic: '+contentTopicTitle.trim() : ''}${contentSubtopic.trim() ? ', sub-topic: '+contentSubtopic.trim() : ''}.`],
            relations: [], misconceptions: [], examples: [],
            provenance: [{ source: 'Admin curriculum selection', board: 'CBSE', curriculum_version: '2026-27' }],
            curriculum_version: '2026-27', verification_status: 'VERIFIED', version: 1
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Teacher Agent could not generate notes.');
      setContentBody(data.content || '');
      if (!contentTitle.trim()) setContentTitle(`${formChapter.title}${contentTopicTitle.trim() ? ' — '+contentTopicTitle.trim() : ''}: Detailed Notes`);
    } catch (err: any) {
      setContentError(err?.message || 'Detailed Notes generation failed.');
    } finally { setContentGenerating(false); }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentError('');
    if (!contentTitle.trim() || !formSubject || !formChapter) return;
    if (!contentBody.trim() && !contentFile) {
      setContentError('Type/paste learning content or upload a study file.');
      return;
    }

    const allowedExtensions = ['pdf','docx','png','jpg','jpeg','webp','txt'];
    if (contentFile) {
      const ext = contentFile.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExtensions.includes(ext)) {
        setContentError('Use PDF, Word (.docx), images or TXT. Export older Word/PowerPoint files as PDF.');
        return;
      }
      if (contentFile.size > 50 * 1024 * 1024) {
        setContentError('File is too large. Maximum upload size is 50 MB.');
        return;
      }
    }

    setContentSaving(true); setContentUploadStatus('Preparing material…');
    try {
      let attachment: Awaited<ReturnType<typeof uploadBrandedStudyFile>> | undefined;
      if (contentFile) {
        if (!profile?.uid) throw new Error('Administrator login is required.');
        attachment = await uploadBrandedStudyFile(contentFile, profile.uid, config, setContentUploadStatus);
      }

      const topic = contentTopicTitle.trim();
      await addNewLearningContent({
        contentType,
        board: contentBoard,
        classGrade: contentClass,
        stream: contentStream,
        subjectId: formSubject.id,
        subjectName: formSubject.name,
        chapterId: formChapter.id,
        chapterTitle: formChapter.title,
        topicId: formChapter.topics.find(t => t.title === topic)?.id || (topic ? `topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'custom'}` : undefined),
        topicTitle: topic || undefined,
        subtopicTitle: contentSubtopic.trim() || undefined,
        title: contentTitle.trim(),
        hindiTitle: contentHindiTitle.trim() || undefined,
        bodyText: contentBody.trim(),
        bodyHindi: contentHindiBody.trim() || undefined,
        ...attachment,
        version: 1,
        approved: true,
        published: true,
        authorUid: profile?.uid || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setContentTitle('');
      setContentHindiTitle('');
      setContentBody('');
      setContentHindiBody('');
      setContentSubtopic('');
      setContentTopicTitle('');
      setContentFile(null);
      setShowContentForm(false);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : 'Unable to save learning material.');
    } finally {
      setContentSaving(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoYoutubeId.trim()) return;

    // clean youtube ID if user pasted full URL
    let cleanId = videoYoutubeId.trim();
    if (cleanId.includes('v=')) {
      cleanId = cleanId.split('v=')[1].split('&')[0];
    } else if (cleanId.includes('youtu.be/')) {
      cleanId = cleanId.split('youtu.be/')[1].split('?')[0];
    }

    await addNewVideo({
      youtubeId: cleanId,
      title: videoTitle.trim(),
      channelTitle: videoChannel.trim(),
      duration: videoDuration.trim() || '30:00',
      views: '1K views',
      thumbnail: `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
      board: videoBoard,
      classGrade: videoClass,
      stream: videoStream,
      subjectId: videoSubject?.id || 'general',
      subjectName: videoSubject?.name,
      chapterId: videoChapter?.id || 'general-chapter',
      chapterTitle: videoChapter?.title,
      topicId: videoTopic.trim() ? 'topic-' + videoTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0,70) : undefined,
      topicTitle: videoTopic.trim() || undefined,
      subtopicTitle: videoSubtopic.trim() || undefined,
      description: 'Curated official lecture approved by Sankatmochan Saarthi Academic Board.',
      tags: ['Saarthi Recommended', videoClass, videoSubject?.name || '', videoChapter?.title || '', videoTopic.trim(), videoSubtopic.trim()].filter(Boolean),
      approved: true,
      published: true,
      createdAt: new Date().toISOString()
    });

    setVideoTitle('');
    setVideoYoutubeId('');
    setVideoTopic('');
    setVideoSubtopic('');
    setShowVideoForm(false);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) return;

    await addNewNotice({
      title: noticeTitle.trim(),
      hindiTitle: noticeHindiTitle.trim() || undefined,
      message: noticeMessage.trim(),
      hindiMessage: noticeHindiMessage.trim() || undefined,
      category: noticeCategory,
      blessingQuote: noticeQuote.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: profile?.displayName || 'Principal A. Kumar'
    });

    setNoticeTitle('');
    setNoticeHindiTitle('');
    setNoticeMessage('');
    setNoticeHindiMessage('');
    setNoticeQuote('');
    setShowNoticeForm(false);
  };

  const handleResolveEnquiry = async (enquiryId: string) => {
    const updated = enquiriesList.map((enq) =>
      enq.id === enquiryId ? { ...enq, status: 'resolved' as const } : enq
    );
    setEnquiriesList(updated);
    localStorage.setItem('saarthi_enquiries', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'enquiries', enquiryId), { status: 'resolved', resolvedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Enquiry status saved locally; Firestore update failed:', err);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border-2 border-red-500/80 shadow-md p-4 sm:p-6 flex flex-col gap-6 min-w-0">
      {adminOperationError && <p role="alert" className="border border-red-300 bg-red-50 rounded-xl p-3 text-sm">{adminOperationError}</p>}
      {/* Admin Header */}
      <div className="border-b border-orange-200 pb-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-4 rounded-2xl border border-red-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-700 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 font-cinzel">
              Admin Control Panel
            </h2>
            <p className="text-xs text-red-900 font-medium">
              Logged in as: <span className="font-bold">{profile?.displayName || 'Principal A. Kumar'}</span> ({profile?.email})
            </p>
          </div>
        </div>

      </div>

      {/* One organized control panel; only the selected manager is opened. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Admin control panel">
        {([
          ['settings', 'Website & Navigation', 'Names, icons, pages, logo and menu order', ImageIcon],
          ['curriculum', 'Subjects, Chapters & Topics', 'Add, edit, replace, remove and restore', BookOpen],
          ['content', 'Learning Materials', 'Upload, publish, replace and restore', FileText],
          ['videos', 'Videos', 'YouTube lectures and links', Youtube],
          ['tests', 'Assessments', 'Tests, questions and evaluation', CheckSquare],
          ['notices', 'Notices', 'Student notices and announcements', BellRing],
          ['students', 'Students', 'Student records and learning progress', Users],
          ['enquiries', 'Enquiries', 'Questions and contact requests', Inbox]
        ] as const).map(([key, label, description, Icon]) => <button key={key} aria-pressed={adminTab === key} onClick={() => setAdminTab(key)} className={`flex flex-col gap-2 border rounded-xl p-3 text-left ${adminTab === key ? 'bg-orange-50 border-orange-500 text-orange-900' : 'bg-white border-stone-200 text-stone-700 hover:bg-orange-50'}`}><Icon className="w-5 h-5" /><span className="font-bold text-sm">{label}</span><span className="text-xs text-stone-500">{description}</span></button>)}
      </div>
      {adminTab === 'curriculum' && <CurriculumManager />}
      {/* Admin Tab 1: Content Manager */}
      {adminTab === 'content' && (
        <div className="space-y-4">
          <ManagedRecords collection="learning_contents" onScopeChange={scope => {
            if (scope.board) setContentBoard(scope.board);
            if (scope.classGrade) setContentClass(scope.classGrade);
            if (scope.stream) setContentStream(scope.stream);
            setContentSubjectId(scope.subjectId); setContentChapterId(scope.chapterId);
            setContentTopicId(''); setContentTopicTitle(scope.topicTitle); setContentSubtopic(scope.subtopicTitle);
            if (scope.contentType) setContentType(scope.contentType);
          }} />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
              Curriculum Content Repository (Add / Edit / Approve / Publish)
            </h3>
            <button
              onClick={() => setShowContentForm(!showContentForm)}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showContentForm ? 'Cancel' : 'Add New Content'}</span>
            </button>
          </div>


          {showContentForm && (
            <form onSubmit={handleCreateContent} className="bg-amber-50/60 border border-orange-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-orange-950 font-cinzel">New Curriculum Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    English Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="e.g. Master Guide: Quadratic Equations"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Hindi Title
                  </label>
                  <input
                    type="text"
                    value={contentHindiTitle}
                    onChange={(e) => setContentHindiTitle(e.target.value)}
                    placeholder="e.g. द्विघात समीकरण सम्पूर्ण मार्गदर्शिका"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-semibold mb-1">Board *</label><select value={contentBoard} onChange={e => { setContentBoard(e.target.value as BoardType); setContentSubjectId(''); setContentChapterId(''); setContentTopicId(''); setContentTopicTitle(''); setContentSubtopic(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{activeOptions(config.boards).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Class *</label><select value={contentClass} onChange={e => { setContentClass(e.target.value as ClassGrade); setContentSubjectId(''); setContentChapterId(''); setContentTopicId(''); setContentTopicTitle(''); setContentSubtopic(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{activeOptions(config.classes).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Stream</label><select value={contentStream} onChange={e => { setContentStream(e.target.value as StreamType); setContentSubjectId(''); setContentChapterId(''); setContentTopicId(''); setContentTopicTitle(''); setContentSubtopic(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{activeOptions(config.streams).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Subject *</label><select value={formSubject?.id || ''} onChange={e => { setContentSubjectId(e.target.value); setContentChapterId(''); setContentTopicId(''); setContentTopicTitle(''); setContentSubtopic(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{formSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Chapter *</label><select value={formChapter?.id || ''} onChange={e => { setContentChapterId(e.target.value); setContentTopicId(''); setContentTopicTitle(''); setContentSubtopic(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{formSubject?.chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.chapterNumber}. {ch.title}</option>)}</select></div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Topic *</label>
                  <select
                    aria-label="Upload topic"
                    value={uploadTopicChoices.includes(contentTopicTitle) ? contentTopicTitle : ''}
                    onChange={e => { setContentTopicTitle(e.target.value); setContentSubtopic(''); }}
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  >
                    <option value="">Select topic</option>
                    {uploadTopicChoices.map(title => <option key={title} value={title}>{title}</option>)}
                  </select>
                  <input
                    aria-label="Add new upload topic"
                    value={uploadTopicChoices.includes(contentTopicTitle) ? '' : contentTopicTitle}
                    onChange={e => { setContentTopicTitle(e.target.value); setContentSubtopic(''); }}
                    placeholder="Or type a new topic"
                    className="w-full mt-1.5 px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
              </div>
              <div><label className="block text-[11px] font-semibold mb-1">Sub-topic</label><input aria-label="Upload subtopic" list="upload-subtopic-choices" value={contentSubtopic} onChange={e => setContentSubtopic(e.target.value)} placeholder="Choose an existing subtopic or type a new name" className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none" /><datalist id="upload-subtopic-choices">{uploadSubtopicChoices.map(title => <option key={title} value={title} />)}</datalist></div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Module Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                >
                  {activeOptions(config.modules).filter(x=>!['test_yourself','recommended_videos'].includes(x.id)).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
                </select>
              </div>

              {contentType === 'detailed_notes' && (
                <div className="rounded-xl border border-orange-300 bg-orange-50 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div><p className="text-xs font-bold text-orange-950">Saarthi Teacher Agent</p><p className="text-[10px] text-stone-600">Generate detailed notes from the selected CBSE class, subject, chapter, topic and sub-topic. Review before publishing.</p></div>
                  <button type="button" onClick={handleGenerateDetailedNotes} disabled={contentGenerating || contentSaving} className="px-4 py-2 bg-stone-900 hover:bg-black disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2"><Sparkles className="w-4 h-4"/>{contentGenerating ? 'Generating Notes...' : 'Generate Detailed Notes'}</button>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Body Text (Markdown supported)
                </label>
                <textarea
                  rows={4}
                  value={contentBody}
                  onChange={(e) => setContentBody(e.target.value)}
                  placeholder="Enter detailed pedagogical notes..."
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none font-mono"
                />
              </div>

              <div className="rounded-xl border border-dashed border-orange-300 bg-white p-3">
                <label className="block text-[11px] font-semibold text-stone-700 mb-2">Upload Study Document (optional when text is entered)</label>
                <label className="cursor-pointer flex items-center gap-2 text-xs font-bold text-orange-700">
                  <Upload className="w-4 h-4" />
                  <span>{contentFile ? contentFile.name : 'Choose PDF, Word (.docx), PNG/JPG/WEBP or TXT'}</span>
                  <input type="file" className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt" onChange={e => setContentFile(e.target.files?.[0] || null)} />
                </label>
                <p className="text-[10px] text-stone-500 mt-1">Word (.docx) becomes a PDF with logo and watermark. Students read the PDF in their dashboard; the original stays private. Word up to 12 MB; PDF/images up to 50 MB; TXT up to 1 MB.</p>
              </div>
              {contentError && <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{contentError}</p>}

              <button
                type="submit"
                disabled={contentSaving}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                {contentSaving ? contentUploadStatus || 'Uploading & Saving...' : 'Save & Publish to Curriculum'}
              </button>
            </form>
          )}

          {/* List of existing contents */}
          <details className="space-y-2"><summary className="cursor-pointer text-sm font-semibold">Publication status & approval</summary>
            {learningContents.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-white border border-stone-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[10px] uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                      {c.contentType}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {c.board} • {c.classGrade} • {c.subjectName}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{c.title}</h4>
                  <p className="text-[11px] text-stone-500">{c.chapterTitle}{c.topicTitle ? ` • ${c.topicTitle}` : ''}{c.subtopicTitle ? ` • ${c.subtopicTitle}` : ''}</p>
                  {c.attachmentUrl && <a href={c.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-orange-700 font-bold hover:underline mt-1"><Paperclip className="w-3 h-3" />{c.attachmentName || 'Open uploaded file'}</a>}
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                    Version: v{c.version} • Status: {c.published ? 'Published' : 'Draft'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveContent(c.id, !c.approved, !c.approved)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      c.approved
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {c.approved ? 'Approved ✓' : 'Approve & Publish'}
                  </button>


                </div>
              </div>
            ))}
          </details>
        </div>
      )}

      {/* Admin Tab 2: Videos */}
      {adminTab === 'videos' && (
        <div className="space-y-4">
          <ManagedRecords collection="youtube_videos" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
              Saarthi Recommended Videos
            </h3>
            <button
              onClick={() => setShowVideoForm(!showVideoForm)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showVideoForm ? 'Cancel' : 'Add Recommended Video'}</span>
            </button>
          </div>

          {showVideoForm && (
            <form onSubmit={adminSubmit(handleCreateVideo)} className="bg-red-50/50 border border-red-200 p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Lecture Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g. Electric Current and Ohm's Law One Shot"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    YouTube URL or ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoYoutubeId}
                    onChange={(e) => setVideoYoutubeId(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or ID"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-semibold mb-1">Board *</label><select value={videoBoard} onChange={e=>setVideoBoard(e.target.value as BoardType)} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{activeOptions(config.boards).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Class *</label><select value={videoClass} onChange={e=>{setVideoClass(e.target.value as ClassGrade);setVideoSubjectId('');setVideoChapterId('')}} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{activeOptions(config.classes).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Stream</label><select value={videoStream} onChange={e=>{setVideoStream(e.target.value as StreamType);setVideoSubjectId('');setVideoChapterId('')}} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{activeOptions(config.streams).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Subject *</label><select value={videoSubject?.id || ''} onChange={e=>{setVideoSubjectId(e.target.value);setVideoChapterId('')}} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{videoSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Chapter *</label><select value={videoChapter?.id || ''} onChange={e=>setVideoChapterId(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{videoSubject?.chapters.map(ch=><option key={ch.id} value={ch.id}>{ch.chapterNumber}. {ch.title}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Topic (write yourself)</label><input value={videoTopic} onChange={e=>setVideoTopic(e.target.value)} placeholder="Type topic name" className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"/></div>
                <div><label className="block text-[11px] font-semibold mb-1">Sub-topic (write yourself)</label><input value={videoSubtopic} onChange={e=>setVideoSubtopic(e.target.value)} placeholder="Type sub-topic name" className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"/></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={videoChannel}
                    onChange={(e) => setVideoChannel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="35:00"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Add Video to Platform
              </button>
            </form>
          )}

          <div className="space-y-2">
            {youtubeVideos.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 rounded bg-stone-900 overflow-hidden shrink-0">
                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 line-clamp-1">{v.title}</h5>
                    <span className="text-[11px] text-stone-500 font-mono">
                      ID: {v.youtubeId} • Channel: {v.channelTitle}
                    </span>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Approved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'tests' && (
        <div className="space-y-4">
          <ManagedRecords collection="tests" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">Assessment Test Bank ({evaluationTests.length})</h3>
            <button onClick={() => setShowTestForm(!showTestForm)} className="px-3.5 py-1.5 bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"><Plus className="w-3.5 h-3.5"/>{showTestForm ? 'Cancel' : 'Create Test'}</button>
          </div>
          {showTestForm && <form onSubmit={adminSubmit(handleCreateTest)} className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-3">
            <input required value={testTitle} onChange={e=>setTestTitle(e.target.value)} placeholder="Test title" className="w-full px-3 py-2 text-xs border rounded-xl bg-white"/>
            <label className="block text-xs">Board<select value={testBoard} onChange={e=>{setTestBoard(e.target.value);setTestSubjectId('');setTestChapterId('')}} className="w-full border rounded-xl p-2">{activeOptions(config.boards).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select value={testClass} onChange={e=>{setTestClass(e.target.value as ClassGrade);setTestSubjectId('');setTestChapterId('')}} className="px-2 py-2 text-xs border rounded-xl bg-white">{activeOptions(config.classes).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select>
              <select value={testStream} onChange={e=>{setTestStream(e.target.value as StreamType);setTestSubjectId('');setTestChapterId('')}} className="px-2 py-2 text-xs border rounded-xl bg-white">{activeOptions(config.streams).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select>
              <select value={testSubject?.id || ''} onChange={e=>{setTestSubjectId(e.target.value);setTestChapterId('')}} className="px-2 py-2 text-xs border rounded-xl bg-white">{testSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select value={testChapter?.id || ''} onChange={e=>setTestChapterId(e.target.value)} className="px-2 py-2 text-xs border rounded-xl bg-white">{testSubject?.chapters.map(ch=><option key={ch.id} value={ch.id}>{ch.chapterNumber}. {ch.title}</option>)}</select>
            </div>
            <textarea required value={testQuestionText} onChange={e=>setTestQuestionText(e.target.value)} placeholder="Question" className="w-full px-3 py-2 text-xs border rounded-xl bg-white"/>
            <textarea required value={testOptionsText} onChange={e=>setTestOptionsText(e.target.value)} placeholder={"Options — one per line\nOption A\nOption B\nOption C\nOption D"} rows={5} className="w-full px-3 py-2 text-xs border rounded-xl bg-white"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input type="number" min={0} value={testCorrectIndex} onChange={e=>setTestCorrectIndex(Number(e.target.value))} placeholder="Correct option index (0=A)" className="px-3 py-2 text-xs border rounded-xl bg-white"/><input value={testExplanation} onChange={e=>setTestExplanation(e.target.value)} placeholder="Explanation" className="px-3 py-2 text-xs border rounded-xl bg-white"/></div>
            <button type="submit" className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs">Publish Test</button>
          </form>}
          <div className="space-y-2">{evaluationTests.map(t=><div key={t.id} className="p-3 border rounded-xl text-xs flex justify-between gap-3"><div><b>{t.title}</b><div className="text-stone-500">{t.classGrade} • {t.subjectId} • {t.questions.length} question(s)</div></div><span className="text-emerald-700 font-bold">{t.published ? 'Published' : 'Draft'}</span></div>)}</div>
        </div>
      )}

      {/* Admin Tab 3: Notices */}
      {adminTab === 'notices' && (
        <div className="space-y-4">
          <ManagedRecords collection="notices" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
              Motivational Circulars & Notice Board
            </h3>
            <button
              onClick={() => setShowNoticeForm(!showNoticeForm)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNoticeForm ? 'Cancel' : 'Post Notice'}</span>
            </button>
          </div>

          {showNoticeForm && (
            <form onSubmit={adminSubmit(handleCreateNotice)} className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. CBSE Practical Exam Schedule Announced"
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Detailed Announcement Message *
                </label>
                <textarea
                  rows={3}
                  required
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  placeholder="Official circular details..."
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  >
                    <option value="motivational">Motivational Blessing</option>
                    <option value="academic">Academic Update</option>
                    <option value="urgent">Urgent Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Blessing Quote (Optional)
                  </label>
                  <input
                    type="text"
                    value={noticeQuote}
                    onChange={(e) => setNoticeQuote(e.target.value)}
                    placeholder="e.g. Sub dukh door karein Sankatmochan Hanuman Ji"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none font-serif italic"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Publish Notice
              </button>
            </form>
          )}

          <div className="space-y-2">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-white border border-stone-200 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{n.title}</span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Tab 4: Students */}
      {adminTab === 'students' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
            Registered Student Directory & Test History ({registeredStudents.length})
          </h3>
          {registeredStudents.length === 0 ? (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border text-xs">No registered students found.</div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto shadow-xs">
              <div className="min-w-[680px]">
                <div className="p-3 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-700 grid grid-cols-4">
                  <span>Student / Email</span><span>Class & Board</span><span>Tests Completed</span><span>Recent Score</span>
                </div>
                <div className="px-3 divide-y divide-stone-100 text-xs text-stone-800">
                  {registeredStudents.map(student => {
                    const results = allStudentResults.filter(r => r.studentUid === student.uid)
                      .sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                    return <div key={student.uid} className="py-3 grid grid-cols-4 items-center gap-2">
                      <div><span className="font-bold block">{student.displayName || 'Student'}</span><span className="text-[11px] text-stone-400 font-mono">{student.email}</span></div>
                      <div>{student.classGrade || '—'} • {student.board || 'CBSE'}{student.stream && student.stream !== 'General' ? ` (${student.stream})` : ''}</div>
                      <div className="font-bold text-orange-700">{results.length} Tests</div>
                      <div className="font-bold text-emerald-700">{results[0] ? `${Math.round(results[0].percentage)}%` : '—'}</div>
                    </div>;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Tab 5: Enquiries */}
      {adminTab === 'enquiries' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
            Student & Parent Enquiries Desk ({enquiriesList.length})
          </h3>

          {enquiriesList.length === 0 ? (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border text-xs">
              No pending enquiries in inbox.
            </div>
          ) : (
            <div className="space-y-3">
              {enquiriesList.map((enq) => (
                <div
                  key={enq.id}
                  className="p-4 bg-white border border-stone-200 rounded-2xl text-xs space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 text-sm">{enq.name}</span>
                      <span className="text-stone-500 ml-2 font-mono">({enq.email})</span>
                      {enq.phone && <span className="text-stone-500 ml-2">• {enq.phone}</span>}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        enq.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {enq.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="font-semibold text-orange-900">
                    Subject: {enq.subjectQuery} ({enq.classGrade})
                  </div>

                  <p className="text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200 leading-relaxed">
                    "{enq.message}"
                  </p>

                  {enq.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveEnquiry(enq.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Mark as Replied & Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Tab 6: Shared Website Manager */}
      {adminTab === 'settings' && <WebsiteSettingsManager />}

    </div>
  );
};
