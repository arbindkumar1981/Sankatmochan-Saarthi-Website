import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  INITIAL_TESTS,
  INITIAL_NOTICES
} from '../data/defaultCurriculum';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { saveCanonicalContent } from '../services/contentLibrary';
import { mapLegacyTest } from '../services/testAssessment';
import { LEGACY_SUBJECTS } from '../data/defaultCurriculum';
import {
  collection,
  setDoc,
  doc,
  query,
  where,
  onSnapshot,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useWebsite } from './WebsiteContext';
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

  babaImageUrl: string;

  // Actions
  saveTestResult: (result: Omit<TestResult, 'id'>) => Promise<string>;
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
  const availableSubjects = useMemo(() => subjectsForSelection(curriculumSubjects, selectedBoard, selectedClass, selectedStream), [curriculumSubjects, selectedBoard, selectedClass, selectedStream]);

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
  }, [selectedBoard, selectedClass, selectedStream, allCurriculumSubjects, selectedSubject?.id]);

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
  const [learningContents, setLearningContents] = useState<LearningContent[]>(INITIAL_LEARNING_CONTENTS);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoItem[]>(INITIAL_YOUTUBE_VIDEOS);
  const [evaluationTests, setEvaluationTests] = useState<EvaluationTest[]>(INITIAL_TESTS);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
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
        : query(collection(db, 'learning_contents'), where('approved', '==', true), where('published', '==', true));
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
  }, [isAdmin, user?.uid]);

  // Sync admin-published videos, tests and notices for every client.
  useEffect(() => {
    const videosQuery = isAdmin ? query(collection(db, 'youtube_videos')) : query(collection(db, 'youtube_videos'), where('approved', '==', true), where('published', '==', true));
    const testsQuery = isAdmin ? query(collection(db, 'tests')) : query(collection(db, 'tests'), where('approved', '==', true), where('published', '==', true));
    const noticesQuery = isAdmin ? query(collection(db, 'notices')) : query(collection(db, 'notices'), where('active', '==', true));

    const unsubVideos = onSnapshot(videosQuery, snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as YouTubeVideoItem));
      const merged = [...INITIAL_YOUTUBE_VIDEOS];
      remote.forEach(item => { const i = merged.findIndex(x => x.id === item.id); if (i >= 0) merged[i] = item; else merged.push(item); });
      setYoutubeVideos(merged);
    }, err => console.warn('youtube_videos sync fallback:', err.message));

    const unsubTests = onSnapshot(testsQuery, snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvaluationTest));
      const merged = [...INITIAL_TESTS];
      remote.forEach(item => { const i = merged.findIndex(x => x.id === item.id); if (i >= 0) merged[i] = item; else merged.push(item); });
      setEvaluationTests(merged);
    }, err => console.warn('tests sync fallback:', err.message));

    const unsubNotices = onSnapshot(noticesQuery, snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as NoticeItem));
      const merged = [...INITIAL_NOTICES];
      remote.forEach(item => { const i = merged.findIndex(x => x.id === item.id); if (i >= 0) merged[i] = item; else merged.push(item); });
      setNotices(merged);
    }, err => console.warn('notices sync fallback:', err.message));

    return () => { unsubVideos(); unsubTests(); unsubNotices(); };
  }, [isAdmin]);

  // Sync test results for current authenticated user
  useEffect(() => {
    if (!user) {
      // Load saved guest test results from localStorage
      const localResults = localStorage.getItem('saarthi_guest_results');
      if (localResults) {
        try {
          setTestResults(JSON.parse(localResults));
        } catch {
          setTestResults([]);
        }
      }
      const localMistakes = localStorage.getItem('saarthi_guest_mistakes');
      if (localMistakes) {
        try {
          setMistakeRecords(JSON.parse(localMistakes));
        } catch {
          setMistakeRecords([]);
        }
      }
      return;
    }

    try {
      const q = query(collection(db, 'test_results'), where('studentUid', '==', user.uid));
      const unsubResults = onSnapshot(
        q,
        (snap) => {
          const list: TestResult[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as TestResult));
          setTestResults(list);
        },
        (err) => {
          console.warn('Error fetching test_results:', err.message);
        }
      );

      const qMistakes = query(collection(db, 'mistakes'), where('studentUid', '==', user.uid));
      const unsubMistakes = onSnapshot(
        qMistakes,
        (snap) => {
          const list: MistakeRecord[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as MistakeRecord));
          setMistakeRecords(list);
        },
        (err) => {
          console.warn('Error fetching mistakes:', err.message);
        }
      );

      return () => {
        unsubResults();
        unsubMistakes();
      };
    } catch (e) {
      console.warn('Firestore subscription error:', e);
    }
  }, [user]);

  // Actions
  const saveTestResult = async (resultData: Omit<TestResult, 'id'>): Promise<string> => {
    const generatedId = 'res-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    const newResult: TestResult = {
      ...resultData,
      studentUid: user && !user.isAnonymous ? user.uid : 'guest-108',
      id: generatedId
    };

    // Calculate mistakes and save them to Mistake Book
    const newMistakes: MistakeRecord[] = [];
    resultData.answers.forEach((ans, idx) => {
      if (!ans.isCorrect) {
        const mistakeItem: MistakeRecord = {
          id: 'mistake-' + Math.random().toString(36).substring(2, 9) + '-' + idx,
          studentUid: newResult.studentUid,
          testResultId: generatedId,
          testId: resultData.testId,
          subjectId: resultData.subjectId,
          questionText: ans.questionText,
          options: ans.options || [],
          selectedOption: ans.selectedOption,
          correctOption: ans.correctOption,
          explanation: ans.explanation,
          masteryStatus: 'pending',
          createdAt: new Date().toISOString()
        };
        newMistakes.push(mistakeItem);
      }
    });

    if (user && !user.isAnonymous) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'test_results', generatedId), newResult);
        for (const m of newMistakes) {
          batch.set(doc(db, 'mistakes', m.id), m);
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `test_results/${generatedId}`);
        throw err;
      }
    } else {
      // Local storage fallback for guest/offline
      const currentRes = [...testResults, newResult];
      setTestResults(currentRes);
      localStorage.setItem('saarthi_guest_results', JSON.stringify(currentRes));

      const currentMists = [...mistakeRecords, ...newMistakes];
      setMistakeRecords(currentMists);
      localStorage.setItem('saarthi_guest_mistakes', JSON.stringify(currentMists));
    }

    return generatedId;
  };

  const updateMistakeStatus = async (
    mistakeId: string,
    status: 'pending' | 'reviewed' | 'mastered'
  ) => {
    const updated = mistakeRecords.map(m => (m.id === mistakeId ? { ...m, masteryStatus: status } : m));
    setMistakeRecords(updated);

    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'mistakes', mistakeId), { masteryStatus: status, reviewedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `mistakes/${mistakeId}`);
      }
    } else {
      localStorage.setItem('saarthi_guest_mistakes', JSON.stringify(updated));
    }
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
        content
      );
      setLearningContents(prev => {
        const existingIndex = prev.findIndex(c => c.id === item.id);
        if (existingIndex < 0) return [item, ...prev];
        return prev.map(c => (c.id === item.id ? item : c));
      });
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
        evaluationTests: (isAdmin ? evaluationTests : evaluationTests.filter(x => x.approved && x.published && !hiddenAssetIds.has(`tests/${x.id}`))).map(x => mapLegacyTest(x, LEGACY_SUBJECTS, curriculumSubjects)),
        notices: isAdmin ? notices : notices.filter(x => x.active && !hiddenAssetIds.has(`notices/${x.id}`)),
        testResults,
        mistakeRecords,
        babaImageUrl,
        saveTestResult,
        updateMistakeStatus,
        addNewLearningContent,
        updateContentApproval,
        addNewTest,
        addNewVideo,
        addNewNotice
      }}
    >
      {children}
    </CurriculumContext.Provider>
  );
};

export const useCurriculum = () => {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error('useCurriculum must be used within CurriculumProvider');
  return ctx;
};
