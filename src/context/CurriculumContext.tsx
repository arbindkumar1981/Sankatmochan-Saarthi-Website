import { recordsForIdentity } from '../services/requestScope';
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  BoardType,
  ClassGrade,
  StreamType,
  SubjectMeta,
  ChapterMeta,
  TopicMeta,
  ContentModuleType,
  LearningContent,
  YouTubeVideoItem,
  EvaluationTest,
  TestResult,
  MistakeRecord,
  NoticeItem,
  Language
} from '../types';
import {
  ALL_SUBJECTS,
  INITIAL_LEARNING_CONTENTS,
  INITIAL_YOUTUBE_VIDEOS,
  INITIAL_NOTICES
} from '../data/defaultCurriculum';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { saveCanonicalContent } from '../services/contentLibrary';
import { withUploadedTopics } from '../services/uploadedTopics';
import { mapLegacyTest } from '../services/testAssessment';
import { learningApi, learningHistory, assessmentScope } from '../services/learningApi';
import { LEGACY_SUBJECTS } from '../data/defaultCurriculum';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  where,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useWebsite } from './WebsiteContext';
import { DisplayLanguageContext } from './DisplayLanguageContext';
import { activeOptions } from '../services/websiteConfig';
import { validateSubject, subjectsForSelection, mergeCurriculum, validateAdminRecord, assetMarker, assetVisibility } from '../services/adminValidation';

export type MainTabType =
  | 'learning'
  | 'materials'
  | 'youtube'
  | 'notices'
  | 'evaluation'
  | 'about'
  | 'contact'
  | 'admin'
  | `page:${string}`;

interface CurriculumContextType {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  activeModule: ContentModuleType;
  setActiveModule: (module: ContentModuleType) => void;

  selectedBoard: BoardType;
  setSelectedBoard: (board: BoardType) => void;
  selectedClass: ClassGrade;
  setSelectedClass: (grade: ClassGrade) => void;
  selectedStream: StreamType;
  setSelectedStream: (stream: StreamType) => void;

  selectedSubject: SubjectMeta | null;
  setSelectedSubject: (subject: SubjectMeta | null) => void;
  selectedChapter: ChapterMeta | null;
  setSelectedChapter: (chapter: ChapterMeta | null) => void;
  selectedTopic: TopicMeta | null;
  setSelectedTopic: (topic: TopicMeta | null) => void;

  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  availableSubjects: SubjectMeta[];
  curriculumSubjects: SubjectMeta[];
  allCurriculumSubjects: SubjectMeta[];
  deletedAssetIds: Set<string>;
  saveCurriculumSubject: (subject: SubjectMeta) => Promise<void>;
  learningContents: LearningContent[];
  youtubeVideos: YouTubeVideoItem[];
  evaluationTests: EvaluationTest[];
  notices: NoticeItem[];
  testResults: TestResult[];
  mistakeRecords: MistakeRecord[];
  knowledgeImportStatus: string;
  assessmentError: string;
  historyError: string;

  babaImageUrl: string;

  // Actions
  refreshLearningHistory: () => Promise<void>;
  updateMistakeStatus: (mistakeId: string, status: 'pending' | 'reviewed' | 'mastered') => Promise<void>;
  addNewLearningContent: (content: Omit<LearningContent, 'id'>) => Promise<void>;
  updateContentApproval: (contentId: string, approved: boolean, published: boolean) => Promise<void>;
  addNewTest: (test: Omit<EvaluationTest, 'id'>) => Promise<void>;
  addNewVideo: (video: Omit<YouTubeVideoItem, 'id'>) => Promise<void>;
  addNewNotice: (notice: Omit<NoticeItem, 'id'>) => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin } = useAuth();
  const { config } = useWebsite();
  const [knowledgeImportStatus, setKnowledgeImportStatus] = useState('');
  const [assessmentError, setAssessmentError] = useState('');
  const [historyError, setHistoryError] = useState('');

  const [activeTab, setActiveTab] = useState<MainTabType>('learning');
  const [activeModule, setActiveModule] = useState<ContentModuleType>('detailed_notes');

  const [selectedBoard, setSelectedBoard] = useState<BoardType>(profile?.board || 'CBSE');
  const [selectedClass, setSelectedClass] = useState<ClassGrade>(profile?.classGrade || 'Class 10');
  const [selectedStream, setSelectedStream] = useState<StreamType>(profile?.stream || 'General');

  const [language, setLanguage] = useState<Language>(profile?.preferredLanguage || 'en');
  const [searchQuery, setSearchQuery] = useState('');

  const babaImageUrl = config.babaImageUrl;

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  // Admin-editable curriculum: Firestore overrides the bundled NCERT/CBSE seed.
  const [allCurriculumSubjects, setCurriculumSubjects] = useState<SubjectMeta[]>(ALL_SUBJECTS);
  const curriculumSubjects = useMemo(() => allCurriculumSubjects.filter(s => !s.deleted), [allCurriculumSubjects]);
  const [deletedAssetIds, setDeletedAssetIds] = useState<Set<string>>(new Set());
  const [hiddenAssetIds, setHiddenAssetIds] = useState<Set<string>>(new Set());
  const [learningContents, setLearningContents] = useState<LearningContent[]>(INITIAL_LEARNING_CONTENTS);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'curriculum_nodes'), snap => {
      const documents = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      setDeletedAssetIds(new Set(documents.filter(d => d.data.kind === 'asset_visibility' && d.data.deleted).map(d => `${d.data.collection}/${d.data.assetId}`)));
      setHiddenAssetIds(new Set(documents.filter(d => d.data.kind === 'asset_visibility' && (d.data.deleted || d.data.hidden)).map(d => `${d.data.collection}/${d.data.assetId}`)));
      setCurriculumSubjects(mergeCurriculum(ALL_SUBJECTS, documents));
    }, err => console.warn('Curriculum sync fallback:', err.message));
    return () => unsub();
  }, []);

  const saveCurriculumSubject = async (subject: SubjectMeta) => {
    requireAdmin();
    validateSubject(subject);
    const saved = { ...subject, revision: (subject.revision || 0) + 1 };
    await runTransaction(db, async transaction => {
      const reference = doc(db, 'curriculum_nodes', subject.id);
      const current = await transaction.get(reference);
      if (Number(current.data()?.subject?.revision || 0) !== (subject.revision || 0)) throw new Error('Another admin changed this subject. Select it again before saving.');
      transaction.set(reference, { kind: 'subject', subject: JSON.parse(JSON.stringify(saved)), deleted: subject.deleted || false, chaptersExplicit: true, updatedAt: new Date().toISOString() });
    });
    setCurriculumSubjects(prev => prev.some(s => s.id === subject.id) ? prev.map(s => s.id === subject.id ? saved : s) : [...prev, saved]);
  };
  // Filter subjects for the chosen class and stream
  const availableSubjects = useMemo(() => withUploadedTopics(subjectsForSelection(curriculumSubjects, selectedBoard, selectedClass, selectedStream), learningContents, selectedBoard, selectedClass, hiddenAssetIds, curriculumSubjects), [curriculumSubjects, selectedBoard, selectedClass, selectedStream, learningContents, hiddenAssetIds]);

  const [selectedSubject, setSelectedSubject] = useState<SubjectMeta | null>(() => {
    return availableSubjects.find(s => s.id === 'c10-science') || availableSubjects[0] || null;
  });

  const [selectedChapter, setSelectedChapter] = useState<ChapterMeta | null>(() => {
    return selectedSubject?.chapters[0] || null;
  });

  const [selectedTopic, setSelectedTopic] = useState<TopicMeta | null>(null);

  // When class or stream changes, update selected subject if not available
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const current = availableSubjects.find(s => s.id === selectedSubject?.id);
      const stillValid = Boolean(current);
      if (current && JSON.stringify(current) !== JSON.stringify(selectedSubject)) setSelectedSubject(current);
      if (!stillValid) {
        const nextSub = availableSubjects[0];
        setSelectedSubject(nextSub);
        setSelectedChapter(nextSub.chapters[0] || null);
        setSelectedTopic(null);
      }
      return;
    }

    // Never leave a stale subject/chapter visible when the active class/stream has no match.
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
  }, [availableSubjects, selectedSubject?.id]);

  // When selectedSubject changes, reset selected chapter to its first chapter
  useEffect(() => {
    if (selectedSubject && selectedSubject.chapters.length > 0) {
      const exists = selectedSubject.chapters.some(c => c.id === selectedChapter?.id);
      if (!exists) {
        setSelectedChapter(selectedSubject.chapters[0]);
        setSelectedTopic(null);
      }
    } else { setSelectedChapter(null); setSelectedTopic(null); }
    const currentChapter = selectedSubject?.chapters.find(c => c.id === selectedChapter?.id);
    if (currentChapter && JSON.stringify(currentChapter) !== JSON.stringify(selectedChapter)) setSelectedChapter(currentChapter);
    const currentTopic = currentChapter?.topics.find(t => t.id === selectedTopic?.id);
    if (selectedTopic && !currentTopic) setSelectedTopic(null);
    else if (currentTopic && JSON.stringify(currentTopic) !== JSON.stringify(selectedTopic)) setSelectedTopic(currentTopic);
  }, [selectedSubject, selectedChapter?.id, selectedTopic?.id]);

  useEffect(() => {
    const boards = activeOptions(config.boards), classes = activeOptions(config.classes), streams = activeOptions(config.streams);
    if (!boards.some(x => x.id === selectedBoard)) setSelectedBoard(boards[0].id);
    if (!classes.some(x => x.id === selectedClass)) setSelectedClass(classes[0].id);
    if (!streams.some(x => x.id === selectedStream)) setSelectedStream(streams[0].id);
    if (!config.modules.some(x => x.id === activeModule && !x.deleted)) setActiveModule(activeOptions(config.modules)[0].id as ContentModuleType);
    if (activeTab !== 'admin' && activeTab !== 'materials' && !config.navigation.some(x => x.id === activeTab && !x.deleted) && !config.pages.some(x => `page:${x.id}` === activeTab && !x.deleted)) setActiveTab((activeOptions(config.navigation)[0]?.id || `page:${config.pages.find(x => !x.deleted)?.id || ''}`) as MainTabType);
  }, [config, selectedBoard, selectedClass, selectedStream, activeModule, activeTab]);

  // Content States
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoItem[]>(INITIAL_YOUTUBE_VIDEOS);
  const [evaluationTests, setEvaluationTests] = useState<EvaluationTest[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const recordIdentity = user?.uid || 'guest';
  const identityRef = useRef(recordIdentity);
  identityRef.current = recordIdentity;
  const [recordOwner, setRecordOwner] = useState(recordIdentity);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [mistakeRecords, setMistakeRecords] = useState<MistakeRecord[]>([]);

  // Load / Sync Firestore contents
  useEffect(() => {
    setLearningContents(INITIAL_LEARNING_CONTENTS);
    if (!user || user.isAnonymous) return;
    // Try to load additional approved learning contents from Firestore
    try {
      const q = isAdmin
        ? query(collection(db, 'learning_contents'))
        : query(collection(db, 'learning_contents'), where('approved', '==', true), where('published', '==', true), where('board', '==', selectedBoard), where('classGrade', '==', selectedClass));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          {
            const remoteContents: LearningContent[] = [];
            snapshot.forEach((d) => {
              remoteContents.push({ id: d.id, ...d.data() } as LearningContent);
            });
            // Merge remote with initial default items
            const merged = [...INITIAL_LEARNING_CONTENTS];
            remoteContents.forEach((rc) => {
              const idx = merged.findIndex(m => m.id === rc.id);
              if (idx >= 0) merged[idx] = rc;
              else merged.push(rc);
            });
            setLearningContents(merged);
          }
        },
        (error) => {
          // Gracefully fallback to local seed data
          console.warn('Firestore learning_contents onSnapshot fallback:', error.message);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Error connecting to learning_contents:', e);
    }
  }, [isAdmin, user?.uid, selectedBoard, selectedClass]);

  // Sync admin-published videos, tests and notices for every client.
  useEffect(() => {
    const videosQuery = isAdmin ? query(collection(db, 'youtube_videos')) : query(collection(db, 'youtube_videos'), where('approved', '==', true), where('published', '==', true));
    const testsQuery = query(collection(db, 'tests'));
    const noticesQuery = isAdmin ? query(collection(db, 'notices')) : query(collection(db, 'notices'), where('active', '==', true));

    const unsubVideos = onSnapshot(videosQuery, snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as YouTubeVideoItem));
      const merged = [...INITIAL_YOUTUBE_VIDEOS];
      remote.forEach(item => { const i = merged.findIndex(x => x.id === item.id); if (i >= 0) merged[i] = item; else merged.push(item); });
      setYoutubeVideos(merged);
    }, err => console.warn('youtube_videos sync fallback:', err.message));

    const unsubTests = isAdmin ? onSnapshot(testsQuery, snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvaluationTest));
      const merged: EvaluationTest[] = [];
      remote.forEach(item => { const i = merged.findIndex(x => x.id === item.id); if (i >= 0) merged[i] = item; else merged.push(item); });
      setEvaluationTests(merged);
    }, err => console.warn('tests sync unavailable:', err.message)) : () => {};

    const unsubNotices = onSnapshot(noticesQuery, snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as NoticeItem));
      const merged = [...INITIAL_NOTICES];
      remote.forEach(item => { const i = merged.findIndex(x => x.id === item.id); if (i >= 0) merged[i] = item; else merged.push(item); });
      setNotices(merged);
    }, err => console.warn('notices sync fallback:', err.message));

    return () => { unsubVideos(); unsubTests(); unsubNotices(); };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || !user || user.isAnonymous || !selectedSubject || !selectedChapter) {
      if (!isAdmin) setEvaluationTests([]);
      return;
    }
    const controller = new AbortController();
    setAssessmentError('');
    void learningApi<EvaluationTest[]>('/tests', assessmentScope({board: selectedBoard, classGrade: selectedClass, stream: selectedStream, subjectId: selectedSubject.id, chapterId: selectedChapter.id, topicId: selectedTopic?.id}), controller.signal)
      .then(tests => { if (!controller.signal.aborted) setEvaluationTests(tests); })
      .catch(() => { if (!controller.signal.aborted) { setEvaluationTests([]); setAssessmentError('Published tests could not load. Reopen Test Yourself to retry.'); } });
    return () => controller.abort();
  }, [isAdmin, user?.uid, selectedBoard, selectedClass, selectedStream, selectedSubject?.id, selectedChapter?.id, selectedTopic?.id]);

  // Preserve historical Firestore attempts, but all new attempts are server-owned in Neon.
  useEffect(() => {
    let cancelled = false;
    setTestResults([]); setMistakeRecords([]); setRecordOwner(recordIdentity);
    setHistoryError('');
    if (!user || user.isAnonymous) return;
    void Promise.allSettled([
      learningHistory(),
      getDocs(query(collection(db, 'test_results'), where('studentUid', '==', user.uid))),
      getDocs(query(collection(db, 'mistakes'), where('studentUid', '==', user.uid)))
    ]).then(([history, oldResults, oldMistakes]) => {
      if (cancelled) return;
      if (history.status === 'rejected' || oldResults.status === 'rejected' || oldMistakes.status === 'rejected') setHistoryError('Some learning history could not load. Reload to retry; saved records are retained.');
      setTestResults([...(history.status === 'fulfilled' ? history.value.results : []), ...(oldResults.status === 'fulfilled' ? oldResults.value.docs.map(d => ({...d.data(), id: d.id, serverEvaluated: false} as TestResult)) : [])]);
      setMistakeRecords([...(history.status === 'fulfilled' ? history.value.mistakes : []), ...(oldMistakes.status === 'fulfilled' ? oldMistakes.value.docs.map(d => ({...d.data(), id: d.id, masteryStatus: d.data().masteryStatus === 'reviewed' ? 'reviewed' : 'pending'} as MistakeRecord)) : [])]);
    }).catch(() => { if (!cancelled) console.warn('Learning history unavailable. Retry after signing in.'); });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const refreshLearningHistory = async () => {
    const owner = recordIdentity;
    const history = await learningHistory();
    if (owner !== identityRef.current) return;
    setHistoryError('');
    setTestResults(previous => [...history.results, ...previous.filter(r => r.serverEvaluated === false)]);
    setMistakeRecords(previous => [...history.mistakes, ...previous.filter(m => testResults.some(r => r.id === m.testResultId && r.serverEvaluated === false))]);
  };

  const updateMistakeStatus = async (mistakeId: string, status: 'pending' | 'reviewed' | 'mastered') => {
    if (status !== 'reviewed') throw new Error('Mastery requires a server-evaluated retest with at least 80%.');
    const mistake = mistakeRecords.find(m => m.id === mistakeId);
    const isServerAttempt = testResults.some(r => r.id === mistake?.testResultId && r.serverEvaluated);
    if (isServerAttempt) await learningApi(`/mistakes/${encodeURIComponent(mistakeId)}/review`, {});
    else await setDoc(doc(db, 'mistakes', mistakeId), {masteryStatus: 'reviewed', reviewedAt: new Date().toISOString()}, {merge: true});
    setMistakeRecords(previous => previous.map(m => m.id === mistakeId ? {...m, masteryStatus: 'reviewed'} : m));
  };

  const requireAdmin = () => {
    if (!user || user.isAnonymous || !isAdmin) {
      throw new Error('Authenticated administrator access is required for content management.');
    }
  };

  const addNewLearningContent = async (content: Omit<LearningContent, 'id'>) => {
    requireAdmin();
    try {
      const item = await saveCanonicalContent(
        {
          board: content.board,
          curriculumVersion: content.curriculumVersion || 'unversioned',
          classGrade: content.classGrade,
          stream: content.stream,
          subjectId: content.subjectId,
          chapterId: content.chapterId,
          topicId: content.topicId,
          concept: content.topicTitle || content.chapterTitle,
          contentType: content.contentType,
          language: content.language || 'en',
          version: content.version
        },
        {...content, approved: false, published: false, requiresServerReview: Boolean(content.storagePath) || ['detailed_notes', 'revision_notes'].includes(content.contentType)}
      );
      setLearningContents(prev => {
        const existingIndex = prev.findIndex(c => c.id === item.id);
        if (existingIndex < 0) return [item, ...prev];
        return prev.map(c => (c.id === item.id ? item : c));
      });
      if (content.storagePath || ['detailed_notes', 'revision_notes'].includes(content.contentType)) {
        setKnowledgeImportStatus('Upload saved. Preparing a Knowledge Base review draft…');
        try {
          await learningApi('/knowledge/import', {contentId: item.id});
          setKnowledgeImportStatus('Upload saved and added to the review queue. Admin verification is still required.');
        } catch (error) {
          setKnowledgeImportStatus(`Upload saved; KB draft needs retry: ${error instanceof Error ? error.message : 'Import unavailable.'} Use Import for KB review below.`);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'learning_contents/canonical');
      throw err;
    }
  };

  const updateContentApproval = async (contentId: string, approved: boolean, published: boolean) => {
    requireAdmin();
    if (published && !approved) throw new Error('Approve content before publishing.');
    const item = learningContents.find(x=>x.id===contentId);
    if (!item || deletedAssetIds.has(`learning_contents/${contentId}`)) throw new Error('Restore deleted content in the manager first.');
    if (item.requiresServerReview && (approved || published)) throw new Error('Review and publish this material in Knowledge review below.');
    const marker = await assetMarker('learning_contents',contentId);
    await runTransaction(db,async transaction=>{
      const reference=doc(db,'learning_contents',contentId);
      const current=await transaction.get(reference);
      if(current.exists() && (current.data()?.deleted || current.data()?.updatedAt!==item.updatedAt)) throw new Error('This item changed. Reload before changing approval.');
      const saved={...item,...current.data(),approved,published,updatedAt:new Date().toISOString()};
      transaction.set(reference,JSON.parse(JSON.stringify(saved)));
      transaction.set(doc(db,'curriculum_nodes',marker),assetVisibility('learning_contents',saved));
    });
  };

  const addNewTest = async (test: Omit<EvaluationTest, 'id'>) => {
    requireAdmin();
    const id = 'test-' + crypto.randomUUID();
    const item: EvaluationTest = { ...test, id };
    if (user && !user.isAnonymous) {
      try {
        validateAdminRecord('tests', item);
        await setDoc(doc(db, 'tests', id), JSON.parse(JSON.stringify(item)));
        setEvaluationTests(prev => [item, ...prev]);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tests/${id}`);
      }
    }
  };

  const addNewVideo = async (video: Omit<YouTubeVideoItem, 'id'>) => {
    requireAdmin();
    const id = 'vid-' + crypto.randomUUID();
    const item: YouTubeVideoItem = { ...video, id };
    if (user && !user.isAnonymous) {
      try {
        validateAdminRecord('youtube_videos', item);
        await setDoc(doc(db, 'youtube_videos', id), JSON.parse(JSON.stringify(item)));
        setYoutubeVideos(prev => [item, ...prev]);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `youtube_videos/${id}`);
      }
    }
  };

  const addNewNotice = async (notice: Omit<NoticeItem, 'id'>) => {
    requireAdmin();
    const id = 'notice-' + crypto.randomUUID();
    const item: NoticeItem = { ...notice, id };
    if (user && !user.isAnonymous) {
      try {
        validateAdminRecord('notices', item);
        await setDoc(doc(db, 'notices', id), JSON.parse(JSON.stringify(item)));
        setNotices(prev => [item, ...prev]);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `notices/${id}`);
      }
    }
  };

  return (
    <CurriculumContext.Provider
      value={{
        activeTab,
        setActiveTab,
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
        language,
        toggleLanguage,
        setLanguage,
        searchQuery,
        setSearchQuery,
        availableSubjects,
        curriculumSubjects,
        allCurriculumSubjects,
        deletedAssetIds,
        saveCurriculumSubject,
        learningContents: isAdmin ? learningContents : learningContents.filter(x => x.approved && x.published && !hiddenAssetIds.has(`learning_contents/${x.id}`)),
        youtubeVideos: isAdmin ? youtubeVideos : youtubeVideos.filter(x => x.approved && x.published && !hiddenAssetIds.has(`youtube_videos/${x.id}`)),
        evaluationTests: (isAdmin ? evaluationTests : evaluationTests.filter(x => x.approved && x.published && !hiddenAssetIds.has(`tests/${x.id}`)).map(x => ({...x, questions: []}))).map(x => mapLegacyTest(x, LEGACY_SUBJECTS, curriculumSubjects)),
        notices: isAdmin ? notices : notices.filter(x => x.active && !hiddenAssetIds.has(`notices/${x.id}`)),
        testResults: recordsForIdentity(recordOwner, recordIdentity, testResults),
        mistakeRecords: recordsForIdentity(recordOwner, recordIdentity, mistakeRecords),
        knowledgeImportStatus,
        assessmentError,
        historyError,
        babaImageUrl,
        refreshLearningHistory,
        updateMistakeStatus,
        addNewLearningContent,
        updateContentApproval,
        addNewTest,
        addNewVideo,
        addNewNotice
      }}
    >
      <DisplayLanguageContext.Provider value={language}>{children}</DisplayLanguageContext.Provider>
    </CurriculumContext.Provider>
  );
};

export const useCurriculum = () => {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error('useCurriculum must be used within CurriculumProvider');
  return ctx;
};

