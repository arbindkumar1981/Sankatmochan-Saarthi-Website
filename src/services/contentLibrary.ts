import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BoardType,
  ClassGrade,
  ContentModuleType,
  Language,
  LearningContent,
  StreamType
} from '../types';

export interface ContentIdentity {
  board: BoardType;
  curriculumVersion: string;
  classGrade: ClassGrade;
  stream: StreamType;
  subjectId: string;
  chapterId: string;
  topicId?: string;
  concept?: string;
  contentType: ContentModuleType;
  language: Language;
  level?: string;
  version?: number;
}

const normalize = (value?: string | number) =>
  String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const buildCanonicalContentKey = (identity: ContentIdentity): string =>
  [
    identity.board,
    identity.curriculumVersion,
    identity.classGrade,
    identity.stream,
    identity.subjectId,
    identity.chapterId,
    identity.topicId || 'chapter',
    identity.concept || 'general',
    identity.contentType,
    identity.language,
    identity.level || 'standard',
    identity.version || 1
  ].map(normalize).join('__');

export const findReusablePublishedContent = async (
  identity: ContentIdentity
): Promise<LearningContent | null> => {
  const canonicalKey = buildCanonicalContentKey(identity);
  const q = query(
    collection(db, 'learning_contents'),
    where('canonicalKey', '==', canonicalKey),
    where('approved', '==', true),
    where('published', '==', true),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const hit = snapshot.docs[0];
  // Reuse telemetry is best-effort and never blocks serving verified content.
  updateDoc(hit.ref, {
    reuseCount: increment(1),
    lastReusedAt: serverTimestamp()
  }).catch(() => undefined);

  return { id: hit.id, ...hit.data() } as LearningContent;
};

// Firestore rejects undefined field values. Remove undefined recursively while
// preserving Firestore special values (serverTimestamp, increment, etc.) and
// all other non-plain objects.
const omitUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.filter(item => item !== undefined).map(item => omitUndefined(item)) as T;
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, omitUndefined(item)])
    ) as T;
  }
  return value;
};

export const saveCanonicalContent = async (
  identity: ContentIdentity,
  content: Omit<LearningContent, 'id'>
): Promise<LearningContent> => {
  const canonicalKey = buildCanonicalContentKey(identity);
  const existing = await findReusablePublishedContent(identity);
  if (existing) return existing;

  // Deterministic document id gives concurrent writers one idempotent target.
  const ref = doc(db, 'learning_contents', canonicalKey);
  const item: LearningContent = {
    ...content,
    id: canonicalKey,
    canonicalKey,
    curriculumVersion: identity.curriculumVersion,
    language: identity.language,
    status: content.published ? 'PUBLISHED' : content.approved ? 'APPROVED' : 'DRAFT',
    reuseCount: 0,
    generatedAt: content.generatedAt || new Date().toISOString()
  };
  const firestoreItem = omitUndefined(item);
  await setDoc(ref, firestoreItem, { merge: false });
  return firestoreItem;
};
