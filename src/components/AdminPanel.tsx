import React, { useEffect, useMemo, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
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
  const {
    learningContents,
    youtubeVideos,
    evaluationTests,
    notices,
    testResults,
    addNewLearningContent,
    updateContentApproval,
    deleteLearningContent,
    addNewVideo,
    addNewTest,
    addNewNotice,
    babaImageUrl,
    setBabaImageUrl,
    selectedBoard,
    selectedClass,
    selectedStream,
    selectedSubject,
    availableSubjects,
    curriculumSubjects,
    saveCurriculumSubject,
    deleteCurriculumSubject,
    language
  } = useCurriculum();

  const { profile, user } = useAuth();

  const [adminTab, setAdminTab] = useState<
    'content' | 'videos' | 'tests' | 'notices' | 'students' | 'enquiries' | 'settings'
  >('content');

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
  const [contentGenerating, setContentGenerating] = useState(false);
  const [contentError, setContentError] = useState('');
  const [showCurriculumManager, setShowCurriculumManager] = useState(false);
  const [curriculumClass, setCurriculumClass] = useState<ClassGrade>('Class 9');
  const [curriculumStream, setCurriculumStream] = useState<StreamType>('General');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');

  const formSubjects = useMemo(() => curriculumSubjects.filter(s => {
    if (!s.classes.includes(contentClass)) return false;
    if (contentClass === 'Class 11' || contentClass === 'Class 12') {
      return s.stream === 'General' || s.stream === contentStream;
    }
    return true;
  }), [curriculumSubjects, contentClass, contentStream]);
  const formSubject = formSubjects.find(s => s.id === contentSubjectId) || formSubjects[0] || null;
  const formChapter = formSubject?.chapters.find(ch => ch.id === contentChapterId) || formSubject?.chapters[0] || null;

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
  const videoSubjects = curriculumSubjects.filter(s => s.classes.includes(videoClass) && (videoClass === 'Class 9' || videoClass === 'Class 10' || s.stream === 'General' || s.stream === videoStream));
  const videoSubject = videoSubjects.find(s => s.id === videoSubjectId) || videoSubjects[0] || null;
  const videoChapter = videoSubject?.chapters.find(ch => ch.id === videoChapterId) || videoSubject?.chapters[0] || null;

  // New Notice Form State
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeHindiTitle, setNoticeHindiTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeHindiMessage, setNoticeHindiMessage] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'motivational' | 'academic' | 'urgent'>('motivational');
  const [noticeQuote, setNoticeQuote] = useState('');

  // Custom photo setting
  const [newPhotoUrl, setNewPhotoUrl] = useState(babaImageUrl);
  const [photoSaved, setPhotoSaved] = useState(false);

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

  const managerSubjects = curriculumSubjects.filter(s => s.classes.includes(curriculumClass) && (curriculumClass === 'Class 9' || curriculumClass === 'Class 10' || s.stream === 'General' || s.stream === curriculumStream));
  const addCurriculumSubject = async () => {
    const name = newSubjectName.trim(); if (!name) return;
    const id = ('admin-' + curriculumClass + '-' + name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
    await saveCurriculumSubject({ id, name, hindiName: name, stream: curriculumClass === 'Class 11' || curriculumClass === 'Class 12' ? curriculumStream : 'General', classes: [curriculumClass], icon: 'BookOpen', chapters: [] });
    setNewSubjectName('');
  };
  const addCurriculumChapter = async (subject: any) => {
    const title = newChapterName.trim(); if (!title) return;
    const n = subject.chapters.length + 1;
    await saveCurriculumSubject({ ...subject, chapters: [...subject.chapters, { id: (subject.id + '-ch-' + Date.now()).slice(0,128), title, hindiTitle: title, chapterNumber: n, topics: [] }] });
    setNewChapterName('');
  };
  const renameCurriculumSubject = async (subject: any) => {
    const name = window.prompt('New subject name', subject.name); if (!name?.trim()) return;
    await saveCurriculumSubject({ ...subject, name: name.trim(), hindiName: name.trim() });
  };
  const renameCurriculumChapter = async (subject: any, chapter: any) => {
    const title = window.prompt('New chapter name', chapter.title); if (!title?.trim()) return;
    await saveCurriculumSubject({ ...subject, chapters: subject.chapters.map((ch: any) => ch.id === chapter.id ? { ...ch, title: title.trim(), hindiTitle: title.trim() } : ch) });
  };
  const removeCurriculumChapter = async (subject: any, chapterId: string) => {
    if (!window.confirm('Delete this chapter?')) return;
    await saveCurriculumSubject({ ...subject, chapters: subject.chapters.filter((ch: any) => ch.id !== chapterId).map((ch: any, i: number) => ({...ch, chapterNumber:i+1})) });
  };

  const normalizeTeacherSubject = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('mathematics')) return 'Mathematics';
    if (n.includes('science') && !n.includes('social')) return 'Science';
    if (n.includes('physics')) return 'Physics';
    if (n.includes('chemistry')) return 'Chemistry';
    if (n.includes('biology')) return 'Biology';
    if (n.includes('social science')) return 'Social Science';
    if (n.includes('history')) return 'History';
    if (n.includes('geography')) return 'Geography';
    if (n.includes('political')) return 'Political Science';
    if (n.includes('economics')) return 'Economics';
    if (n.includes('sociology')) return 'Sociology';
    if (n.includes('psychology')) return 'Psychology';
    if (n.includes('accountancy')) return 'Accountancy';
    if (n.includes('business studies')) return 'Business Studies';
    if (n.includes('computer science')) return 'Computer Science';
    if (n.includes('informatics')) return 'Informatics Practices';
    if (n.includes('english')) return 'English';
    if (n.includes('hindi')) return 'Hindi';
    if (n.includes('sanskrit')) return 'Sanskrit';
    if (n.includes('physical education')) return 'Physical Education';
    return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*[—-].*$/, '').trim();
  };

  const classRoman = (grade: ClassGrade) => ({ 'Class 9': 'IX', 'Class 10': 'X', 'Class 11': 'XI', 'Class 12': 'XII' }[grade]);

  const handleGenerateDetailedNotes = async () => {
    setContentError('');
    if (!formSubject || !formChapter) { setContentError('Select Subject and Chapter first.'); return; }
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
          subject: normalizeTeacherSubject(formSubject.name),
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

    const allowedExtensions = ['pdf','doc','docx','ppt','pptx','png','jpg','jpeg','webp','txt'];
    if (contentFile) {
      const ext = contentFile.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExtensions.includes(ext)) {
        setContentError('Unsupported file. Use PDF, DOC/DOCX, PPT/PPTX, PNG/JPG/WEBP or TXT.');
        return;
      }
      if (contentFile.size > 50 * 1024 * 1024) {
        setContentError('File is too large. Maximum upload size is 50 MB.');
        return;
      }
    }

    setContentSaving(true);
    try {
      let attachmentUrl: string | undefined;
      let storagePath: string | undefined;
      if (contentFile) {
        const safeName = contentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        storagePath = `learning-materials/${profile?.uid || 'admin'}/${Date.now()}-${safeName}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, contentFile, { contentType: contentFile.type || 'application/octet-stream' });
        attachmentUrl = await getDownloadURL(storageRef);
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
        topicId: topic ? `topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'custom'}` : undefined,
        topicTitle: topic || undefined,
        subtopicTitle: contentSubtopic.trim() || undefined,
        title: contentTitle.trim(),
        hindiTitle: contentHindiTitle.trim() || undefined,
        bodyText: contentBody.trim(),
        bodyHindi: contentHindiBody.trim() || undefined,
        attachmentUrl,
        attachmentName: contentFile?.name,
        attachmentType: contentFile?.type,
        attachmentSize: contentFile?.size,
        storagePath,
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
      thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=640&auto=format&fit=crop`,
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

  const handleSavePhotoSettings = () => {
    if (newPhotoUrl.trim()) {
      setBabaImageUrl(newPhotoUrl.trim());
      setPhotoSaved(true);
      setTimeout(() => setPhotoSaved(false), 2000);
    }
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
      {/* Admin Header */}
      <div className="border-b border-orange-200 pb-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-4 rounded-2xl border border-red-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-700 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 font-cinzel">
              Centralized Administration & Curriculum Control
            </h2>
            <p className="text-xs text-red-900 font-medium">
              Logged in as: <span className="font-bold">{profile?.displayName || 'Principal A. Kumar'}</span> ({profile?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200">
            Secure RBAC Mode
          </span>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl text-xs font-bold">
        <button
          onClick={() => setAdminTab('content')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'content'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-orange-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Learning Materials ({learningContents.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('videos')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'videos'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-red-600'
          }`}
        >
          <Youtube className="w-3.5 h-3.5" />
          <span>YouTube Lectures ({youtubeVideos.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('tests')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'tests'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-emerald-600'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Assessment Tests ({evaluationTests.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('notices')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'notices'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-amber-600'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Notice Board ({notices.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('students')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'students'
              ? 'bg-stone-800 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Records</span>
        </button>

        <button
          onClick={() => setAdminTab('enquiries')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'enquiries'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-blue-600'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Enquiries Desk</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'settings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-purple-600'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Baba Ji Photo Settings</span>
        </button>
      </div>

      {/* Admin Tab 1: Content Manager */}
      {adminTab === 'content' && (
        <div className="space-y-4">
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

          <div className="flex justify-end"><button type="button" onClick={() => setShowCurriculumManager(!showCurriculumManager)} className="px-3 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold">{showCurriculumManager ? 'Close Curriculum Manager' : 'Manage Subjects & Chapters'}</button></div>
          {showCurriculumManager && (
            <div className="bg-stone-50 border rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-sm">Curriculum Manager — Add / Rename / Delete Subjects & Chapters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select value={curriculumClass} onChange={e=>setCurriculumClass(e.target.value as ClassGrade)} className="border rounded-lg p-2 text-xs"><option>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option></select>
                <select value={curriculumStream} onChange={e=>setCurriculumStream(e.target.value as StreamType)} className="border rounded-lg p-2 text-xs"><option>General</option><option>Science</option><option>Commerce</option><option>Humanities</option></select>
                <div className="flex gap-1"><input value={newSubjectName} onChange={e=>setNewSubjectName(e.target.value)} placeholder="New subject name" className="border rounded-lg p-2 text-xs flex-1"/><button type="button" onClick={addCurriculumSubject} className="bg-orange-600 text-white px-3 rounded-lg text-xs">Add</button></div>
              </div>
              {managerSubjects.map(subject => <div key={subject.id} className="bg-white border rounded-xl p-3">
                <div className="flex flex-wrap justify-between gap-2"><b className="text-xs">{subject.name}</b><div className="flex gap-2"><button type="button" onClick={()=>renameCurriculumSubject(subject)} className="text-xs text-blue-700">Rename</button><button type="button" onClick={()=>{if(window.confirm('Delete this subject and its chapter list?')) deleteCurriculumSubject(subject.id)}} className="text-xs text-red-700">Delete</button></div></div>
                <div className="mt-2 space-y-1">{subject.chapters.map(ch=><div key={ch.id} className="flex justify-between text-xs border-t pt-1"><span>{ch.chapterNumber}. {ch.title}</span><span className="flex gap-2"><button type="button" onClick={()=>renameCurriculumChapter(subject,ch)} className="text-blue-700">Edit</button><button type="button" onClick={()=>removeCurriculumChapter(subject,ch.id)} className="text-red-700">Delete</button></span></div>)}</div>
                <div className="flex gap-1 mt-2"><input value={newChapterName} onChange={e=>setNewChapterName(e.target.value)} placeholder="Type chapter name, then Add to this subject" className="border rounded-lg p-2 text-xs flex-1"/><button type="button" onClick={()=>addCurriculumChapter(subject)} className="bg-emerald-700 text-white px-3 rounded-lg text-xs">Add Chapter</button></div>
              </div>)}
            </div>
          )}

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
                <div><label className="block text-[11px] font-semibold mb-1">Board *</label><select value={contentBoard} onChange={e => setContentBoard(e.target.value as BoardType)} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"><option value="CBSE">CBSE</option><option value="ICSE_ISC">ICSE / ISC</option><option value="UP_BOARD">UP Board</option><option value="BIHAR_BOARD">Bihar Board</option><option value="STATE_BOARD">State Board</option></select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Class *</label><select value={contentClass} onChange={e => { setContentClass(e.target.value as ClassGrade); setContentSubjectId(''); setContentChapterId(''); setContentTopicId(''); setContentTopicTitle(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"><option>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option></select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Stream</label><select value={contentStream} onChange={e => setContentStream(e.target.value as StreamType)} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"><option>General</option><option>Science</option><option>Commerce</option><option>Humanities</option></select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Subject *</label><select value={formSubject?.id || ''} onChange={e => { setContentSubjectId(e.target.value); setContentChapterId(''); setContentTopicId(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{formSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Chapter *</label><select value={formChapter?.id || ''} onChange={e => { setContentChapterId(e.target.value); setContentTopicId(''); }} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white">{formSubject?.chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.chapterNumber}. {ch.title}</option>)}</select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Topic (write yourself)</label><input value={contentTopicTitle} onChange={e => setContentTopicTitle(e.target.value)} placeholder="Type topic name" className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none" /></div>
              </div>
              <div><label className="block text-[11px] font-semibold mb-1">Sub-topic</label><input value={contentSubtopic} onChange={e => setContentSubtopic(e.target.value)} placeholder="Enter sub-topic name (optional)" className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none" /></div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Module Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                >
                  <option value="detailed_notes">Detailed Notes</option>
                  <option value="revision_notes">Revision Notes</option>
                  <option value="formulae">Definitions & Formulae</option>
                  <option value="mindmaps">Mind Maps</option>
                  <option value="flashcards">Flashcards</option>
                  <option value="pyqs">Previous Year Questions</option>
                  <option value="cbqs">Competency Questions</option>
                  <option value="case_studies">Case Study</option>
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
                  <span>{contentFile ? contentFile.name : 'Choose PDF, DOC/DOCX, PPT/PPTX, PNG/JPG/WEBP or TXT'}</span>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt" onChange={e => setContentFile(e.target.files?.[0] || null)} />
                </label>
                <p className="text-[10px] text-stone-500 mt-1">Maximum file size: 50 MB. Files are stored securely in Firebase Storage.</p>
              </div>
              {contentError && <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{contentError}</p>}

              <button
                type="submit"
                disabled={contentSaving}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                {contentSaving ? 'Uploading & Saving...' : 'Save & Publish to Curriculum'}
              </button>
            </form>
          )}

          {/* List of existing contents */}
          <div className="space-y-2">
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
                    onClick={() => updateContentApproval(c.id, !c.approved, !c.published)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      c.approved
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {c.approved ? 'Approved ✓' : 'Approve & Publish'}
                  </button>

                  <button
                    onClick={() => deleteLearningContent(c.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Tab 2: Videos */}
      {adminTab === 'videos' && (
        <div className="space-y-4">
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
            <form onSubmit={handleCreateVideo} className="bg-red-50/50 border border-red-200 p-4 rounded-2xl space-y-3">
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
                <div><label className="block text-[11px] font-semibold mb-1">Board *</label><select value={videoBoard} onChange={e=>setVideoBoard(e.target.value as BoardType)} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"><option value="CBSE">CBSE</option><option value="ICSE_ISC">ICSE / ISC</option><option value="UP_BOARD">UP Board</option><option value="BIHAR_BOARD">Bihar Board</option><option value="STATE_BOARD">State Board</option></select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Class *</label><select value={videoClass} onChange={e=>{setVideoClass(e.target.value as ClassGrade);setVideoSubjectId('');setVideoChapterId('')}} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"><option>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option></select></div>
                <div><label className="block text-[11px] font-semibold mb-1">Stream</label><select value={videoStream} onChange={e=>{setVideoStream(e.target.value as StreamType);setVideoSubjectId('');setVideoChapterId('')}} className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"><option>General</option><option>Science</option><option>Commerce</option><option>Humanities</option></select></div>
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

      {/* Admin Tab 3: Notices */}
      {adminTab === 'notices' && (
        <div className="space-y-4">
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
            <form onSubmit={handleCreateNotice} className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
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

      {/* Admin Tab 6: Baba Neem Karoli Ji Photo Settings */}
      {adminTab === 'settings' && (
        <div className="bg-amber-50/50 border border-orange-200 p-5 rounded-2xl space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-400 p-0.5 bg-white shadow-md">
              <img
                src={babaImageUrl}
                alt="Baba Neem Karoli Ji"
                className="w-full h-full object-cover object-top rounded-full bg-amber-900"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 font-cinzel">
                Revered Baba Neem Karoli Ji’s Photo Configuration
              </h3>
              <p className="text-xs text-stone-600">
                Official sacred darshan photo of Maharaj-ji. It updates automatically at the top of every page across the platform.
              </p>
            </div>
          </div>

          {/* Quick Presets of Authentic Original Photographs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Authentic Original Photo Presets:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Shri_Neem_Karoli_Baba.png';
                  setNewPhotoUrl(url);
                  setBabaImageUrl(url);
                  setPhotoSaved(true);
                  setTimeout(() => setPhotoSaved(false), 2000);
                }}
                className="p-2 text-left bg-white border border-orange-300 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 transition-all flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-orange-400">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Shri_Neem_Karoli_Baba.png"
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="text-[11px] leading-tight font-semibold text-stone-800">
                  <span>मूल पावन स्वरूप (कंबल वाले बाबा)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG/640px-Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG';
                  setNewPhotoUrl(url);
                  setBabaImageUrl(url);
                  setPhotoSaved(true);
                  setTimeout(() => setPhotoSaved(false), 2000);
                }}
                className="p-2 text-left bg-white border border-orange-300 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 transition-all flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-orange-400">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG/640px-Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG"
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="text-[11px] leading-tight font-semibold text-stone-800">
                  <span>समाधि मंदिर वृन्दावन दर्शन</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Custom Image URL:
            </label>
            <input
              type="text"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePhotoSettings}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Update Everywhere</span>
            </button>
            {photoSaved && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Updated successfully!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
