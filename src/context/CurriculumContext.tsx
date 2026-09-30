import React, { createContext, useContext, useState, useEffect } from 'react';
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
  INITIAL_NOTICES,
  BABA_IMAGE_URL
} from '../data/defaultCurriculum';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

export type MainTabType =
  | 'learning'
  | 'youtube'
  | 'notices'
  | 'evaluation'
  | 'about'
  | 'contact'
  | 'admin';

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
  learningContents: LearningContent[];
  youtubeVideos: YouTubeVideoItem[];
  evaluationTests: EvaluationTest[];
  notices: NoticeItem[];
  testResults: TestResult[];
  mistakeRecords: MistakeRecord[];

  babaImageUrl: string;
  setBabaImageUrl: (url: string) => void;

  // Actions
  saveTestResult: (result: Omit<TestResult, 'id'>) => Promise<string>;
  updateMistakeStatus: (mistakeId: string, status: 'pending' | 'reviewed' | 'mastered') => Promise<void>;
  addNewLearningContent: (content: Omit<LearningContent, 'id'>) => Promise<void>;
  updateContentApproval: (contentId: string, approved: boolean, published: boolean) => Promise<void>;
  deleteLearningContent: (contentId: string) => Promise<void>;
  addNewTest: (test: Omit<EvaluationTest, 'id'>) => Promise<void>;
  addNewVideo: (video: Omit<YouTubeVideoItem, 'id'>) => Promise<void>;
  addNewNotice: (notice: Omit<NoticeItem, 'id'>) => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTabType>('learning');
  const [activeModule, setActiveModule] = useState<ContentModuleType>('detailed_notes');

  const [selectedBoard, setSelectedBoard] = useState<BoardType>(profile?.board || 'CBSE');
  const [selectedClass, setSelectedClass] = useState<ClassGrade>(profile?.classGrade || 'Class 10');
  const [selectedStream, setSelectedStream] = useState<StreamType>(profile?.stream || 'General');

  const [language, setLanguage] = useState<Language>(profile?.preferredLanguage || 'en');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Baba Photo URL with authentic fallback
  const [babaImageUrl, setBabaImageUrlState] = useState<string>(() => {
    const stored = localStorage.getItem('saarthi_baba_photo_url');
    if (!stored || stored.includes('unsplash.com') || stored.includes('wikipedia')) {
      localStorage.setItem('saarthi_baba_photo_url', BABA_IMAGE_URL);
      return BABA_IMAGE_URL;
    }
    return stored;
  });

  const setBabaImageUrl = (url: string) => {
    setBabaImageUrlState(url);
    localStorage.setItem('saarthi_baba_photo_url', url);
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  // Filter subjects for the chosen class and stream
  const availableSubjects = ALL_SUBJECTS.filter((sub) => {
    const classMatch = sub.classes.includes(selectedClass);
    if (!classMatch) return false;
    if (selectedClass === 'Class 11' || selectedClass === 'Class 12') {
      if (sub.stream === 'General') return true;
      return sub.stream === selectedStream;
    }
    return true;
  });

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
      const stillValid = availableSubjects.some(s => s.id === selectedSubject?.id);
      if (!stillValid) {
        const nextSub = availableSubjects[0];
        setSelectedSubject(nextSub);
        setSelectedChapter(nextSub.chapters[0] || null);
        setSelectedTopic(null);
      }
    }
  }, [selectedClass, selectedStream]);

  // When selectedSubject changes, reset selected chapter to its first chapter
  useEffect(() => {
    if (selectedSubject && selectedSubject.chapters.length > 0) {
      const exists = selectedSubject.chapters.some(c => c.id === selectedChapter?.id);
      if (!exists) {
        setSelectedChapter(selectedSubject.chapters[0]);
        setSelectedTopic(null);
      }
    }
  }, [selectedSubject]);

  // Content States
  const [learningContents, setLearningContents] = useState<LearningContent[]>(INITIAL_LEARNING_CONTENTS);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoItem[]>(INITIAL_YOUTUBE_VIDEOS);
  const [evaluationTests, setEvaluationTests] = useState<EvaluationTest[]>(INITIAL_TESTS);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [mistakeRecords, setMistakeRecords] = useState<MistakeRecord[]>([]);

  // Load / Sync Firestore contents
  useEffect(() => {
    // Try to load additional approved learning contents from Firestore
    try {
      const q = query(collection(db, 'learning_contents'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
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
  }, []);

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
      id: generatedId
    };

    // Calculate mistakes and save them to Mistake Book
    const newMistakes: MistakeRecord[] = [];
    resultData.answers.forEach((ans, idx) => {
      if (!ans.isCorrect) {
        const mistakeItem: MistakeRecord = {
          id: 'mistake-' + Math.random().toString(36).substring(2, 9) + '-' + idx,
          studentUid: resultData.studentUid,
          testResultId: generatedId,
          testId: resultData.testId,
          subjectId: resultData.subjectId,
          questionText: ans.questionText,
          options: [], // populated from context if available
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
        await setDoc(doc(db, 'test_results', generatedId), newResult);
        for (const m of newMistakes) {
          await setDoc(doc(db, 'mistakes', m.id), m);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `test_results/${generatedId}`);
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

  const addNewLearningContent = async (content: Omit<LearningContent, 'id'>) => {
    const id = 'content-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    const item: LearningContent = { ...content, id };
    setLearningContents(prev => [item, ...prev]);

    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'learning_contents', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `learning_contents/${id}`);
      }
    }
  };

  const updateContentApproval = async (contentId: string, approved: boolean, published: boolean) => {
    setLearningContents(prev =>
      prev.map(c => (c.id === contentId ? { ...c, approved, published } : c))
    );
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'learning_contents', contentId), { approved, published }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `learning_contents/${contentId}`);
      }
    }
  };

  const deleteLearningContent = async (contentId: string) => {
    setLearningContents(prev => prev.filter(c => c.id !== contentId));
    if (user && !user.isAnonymous) {
      try {
        // we can remove or mark deleted
      } catch (err) {
        console.error(err);
      }
    }
  };

  const addNewTest = async (test: Omit<EvaluationTest, 'id'>) => {
    const id = 'test-' + Math.random().toString(36).substring(2, 9);
    const item: EvaluationTest = { ...test, id };
    setEvaluationTests(prev => [item, ...prev]);
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'tests', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tests/${id}`);
      }
    }
  };

  const addNewVideo = async (video: Omit<YouTubeVideoItem, 'id'>) => {
    const id = 'vid-' + Math.random().toString(36).substring(2, 9);
    const item: YouTubeVideoItem = { ...video, id };
    setYoutubeVideos(prev => [item, ...prev]);
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'youtube_videos', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `youtube_videos/${id}`);
      }
    }
  };

  const addNewNotice = async (notice: Omit<NoticeItem, 'id'>) => {
    const id = 'notice-' + Math.random().toString(36).substring(2, 9);
    const item: NoticeItem = { ...notice, id };
    setNotices(prev => [item, ...prev]);
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'notices', id), item);
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
        learningContents,
        youtubeVideos,
        evaluationTests,
        notices,
        testResults,
        mistakeRecords,
        babaImageUrl,
        setBabaImageUrl,
        saveTestResult,
        updateMistakeStatus,
        addNewLearningContent,
        updateContentApproval,
        deleteLearningContent,
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
