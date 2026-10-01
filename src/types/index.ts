export type UserRole = 'student' | 'admin';

export type Language = 'en' | 'hi';

export type BoardType = 'CBSE' | 'ICSE_ISC' | 'UP_BOARD' | 'BIHAR_BOARD' | 'STATE_BOARD';

export type ClassGrade = 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12';

export type StreamType = 'General' | 'Science' | 'Commerce' | 'Humanities';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  board?: BoardType;
  classGrade?: ClassGrade;
  stream?: StreamType;
  preferredLanguage?: Language;
  studyStreakDays?: number;
  totalTestsTaken?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ContentModuleType =
  | 'detailed_notes'
  | 'revision_notes'
  | 'formulae'
  | 'mindmaps'
  | 'flashcards'
  | 'pyqs'
  | 'cbqs'
  | 'case_studies'
  | 'test_yourself';

export interface FlashcardItem {
  id: string;
  question: string;
  questionHindi?: string;
  answer: string;
  answerHindi?: string;
  hint?: string;
  category?: string;
}

export interface FormulaItem {
  id: string;
  name: string;
  nameHindi?: string;
  formula: string;
  definition: string;
  definitionHindi?: string;
  units?: string;
  application?: string;
}

export interface PYQItem {
  id: string;
  year: string;
  marks: number;
  question: string;
  questionHindi?: string;
  solution: string;
  solutionHindi?: string;
  repeatedFrequency?: string;
}

export interface CaseStudyItem {
  id: string;
  title: string;
  caseText: string;
  caseHindi?: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface LearningContent {
  id: string;
  /** Stable identity used to reuse the same approved asset instead of regenerating it. */
  canonicalKey?: string;
  curriculumVersion?: string;
  language?: Language;
  status?: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  sourceKnowledgeUnitId?: string;
  replacementContentId?: string;
  reuseCount?: number;
  generatedAt?: string;
  validatedAt?: string;
  archivedAt?: string;
  contentType: ContentModuleType;
  board: BoardType;
  classGrade: ClassGrade;
  stream: StreamType;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterTitle: string;
  topicId?: string;
  topicTitle?: string;
  subtopicId?: string;
  subtopicTitle?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  storagePath?: string;
  title: string;
  hindiTitle?: string;
  bodyText: string;
  bodyHindi?: string;
  flashcardItems?: FlashcardItem[];
  formulaItems?: FormulaItem[];
  pyqItems?: PYQItem[];
  caseStudyItem?: CaseStudyItem;
  mindmapNodes?: {
    id: string;
    label: string;
    description: string;
    children?: string[];
  }[];
  version: number;
  approved: boolean;
  published: boolean;
  authorUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeVideoItem {
  id: string;
  youtubeId: string;
  title: string;
  hindiTitle?: string;
  channelTitle: string;
  duration: string;
  views?: string;
  thumbnail: string;
  board: BoardType;
  classGrade: ClassGrade;
  subjectId: string;
  chapterId: string;
  topicId?: string;
  description: string;
  tags?: string[];
  approved: boolean;
  published: boolean;
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  questionText: string;
  questionHindi?: string;
  options: string[];
  optionsHindi?: string[];
  correctIndex: number;
  explanation: string;
  explanationHindi?: string;
  marks: number;
  competencyTag?: string; // 'analytical' | 'conceptual' | 'numerical' | 'application'
}

export interface EvaluationTest {
  id: string;
  title: string;
  hindiTitle?: string;
  testType: 'topic' | 'chapter' | 'full_syllabus';
  board: BoardType;
  classGrade: ClassGrade;
  stream: StreamType;
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questions: TestQuestion[];
  approved: boolean;
  published: boolean;
  createdAt: string;
}

export interface TestResultAnswer {
  questionId: string;
  questionText: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
  marksAwarded: number;
}

export interface TestResult {
  id: string;
  studentUid: string;
  studentName: string;
  testId: string;
  testTitle: string;
  testType: 'topic' | 'chapter' | 'full_syllabus';
  board: BoardType;
  classGrade: ClassGrade;
  subjectId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  answers: TestResultAnswer[];
  strengths: string[];
  weaknesses: string[];
  remarks: string;
  createdAt: string;
}

export interface MistakeRecord {
  id: string;
  studentUid: string;
  testResultId: string;
  testId: string;
  subjectId: string;
  chapterId?: string;
  questionText: string;
  questionHindi?: string;
  options: string[];
  selectedOption: number;
  correctOption: number;
  explanation: string;
  masteryStatus: 'pending' | 'reviewed' | 'mastered';
  createdAt: string;
  reviewedAt?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  hindiTitle?: string;
  message: string;
  hindiMessage?: string;
  category: 'motivational' | 'academic' | 'urgent' | 'highlight';
  targetClass?: string;
  targetStudentUid?: string;
  strengthsNote?: string;
  improvementNote?: string;
  blessingQuote?: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  classGrade?: string;
  subjectQuery?: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  reply?: string;
  createdAt: string;
}

export interface SubjectMeta {
  id: string;
  name: string;
  hindiName: string;
  officialCode?: string;
  stream: StreamType;
  classes: ClassGrade[];
  icon: string;
  chapters: ChapterMeta[];
}

export interface ChapterMeta {
  id: string;
  title: string;
  hindiTitle: string;
  chapterNumber: number;
  topics: TopicMeta[];
}

export interface TopicMeta {
  id: string;
  title: string;
  hindiTitle: string;
  order: number;
}
