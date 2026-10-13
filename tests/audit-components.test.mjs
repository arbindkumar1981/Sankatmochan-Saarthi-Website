import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mocks = {
  auth: `let identity; export const setIdentity = value => identity = value; export const useAuth = () => identity;`,
  curriculum: `let state; export const setCurriculum = value => state = value; export const useCurriculum = () => state;`,
  website: `import {DEFAULT_WEBSITE_CONFIG} from './src/services/websiteConfig'; export const useWebsite=()=>({config:DEFAULT_WEBSITE_CONFIG,text:value=>value}); export const WebsiteText=({original})=>original;`,
  firebase: `export const db={}; export const auth={};`,
  firestore: `export const doc=()=>({}); export const setDoc=async()=>{};`,
  pdfreader: `export const StudyPdfReader=()=>null;`
};
const result = await build({
  absWorkingDir: root, bundle: true, platform: 'node', format: 'cjs', write: false,
  logLevel: 'silent', define: { 'import.meta.env': '{}' },
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
    import {ContentArea} from './src/components/ContentArea'; import {AuthModal} from './src/components/AuthModal';
    import {setIdentity} from './src/context/AuthContext'; import {setCurriculum} from './src/context/CurriculumContext';
    export function renderContent(state){setIdentity({user:{uid:'student-a',isAnonymous:false},profile:{uid:'student-a'}});setCurriculum(state);return renderToStaticMarkup(<ContentArea/>);}
    export function renderLogin(tab){setIdentity({authModalOpen:true,authModalInitialTab:tab,closeAuthModal:()=>{},signInWithGoogle:async()=>{}});setCurriculum({language:'en'});return renderToStaticMarkup(<AuthModal/>);}` },
  plugins: [{ name: 'isolated-io', setup(builder) {
    for (const [pattern, path] of [[/AuthContext$/, 'auth'], [/CurriculumContext$/, 'curriculum'], [/WebsiteContext$/, 'website'], [/services\/firebase$/, 'firebase'], [/^firebase\/firestore$/, 'firestore'], [/StudyPdfReader$/, 'pdfreader']]) {
      builder.onResolve({ filter: pattern }, () => ({ path, namespace: 'audit-mock' }));
    }
    builder.onLoad({ filter: /.*/, namespace: 'audit-mock' }, args => ({ contents: mocks[args.path], loader: 'js', resolveDir: root }));
  }}]
});
const loaded = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), loaded, loaded.exports);
const api = loaded.exports;
const subject = { id: 'biology', name: 'Biology', chapters: [] };
const chapter = { id: 'flower', chapterNumber: 1, title: 'Flowering plants', topics: [] };
const state = (module, content = {}) => ({ activeModule: module, selectedBoard: 'CBSE', selectedClass: 'Class 12', selectedStream: 'Science', selectedSubject: subject, selectedChapter: chapter, selectedTopic: null, language: 'en', evaluationTests: [], youtubeVideos: [], learningContents: [{ id: 'content', contentType: module, board: 'CBSE', classGrade: 'Class 12', stream: 'Science', subjectId: subject.id, chapterId: chapter.id, title: 'Flowering plants', bodyText: '', approved: true, published: true, ...content }] });

test('published mind maps render their real concepts and connections', () => {
  const html = api.renderContent(state('mindmaps', { mindmapNodes: [{ id: 'flower', label: 'Flower', description: 'Reproductive organ.', children: ['pollen'] }, { id: 'pollen', label: 'Pollen', description: 'Male gametophyte.' }] }));
  assert.ok(html.includes('Reproductive organ.'));
  assert.ok(html.includes('Male gametophyte.'));
  assert.ok(html.includes('Connects to:'));
  assert.ok(!html.includes('Pillar 1'));
});
test('missing mind maps show an honest empty state rather than a generic diagram', () => {
  const html = api.renderContent(state('mindmaps'));
  assert.ok(html.includes('No verified mind map'));
  assert.ok(!html.includes('Mathematical Models'));
});
test('published flashcards retain flip controls and their exact question', () => {
  const html = api.renderContent(state('flashcards', { flashcardItems: [{ id: 'one', question: 'What is pollen?', answer: 'The male gametophyte.' }] }));
  assert.ok(html.includes('What is pollen?'));
  assert.ok(html.includes('Got It'));
  assert.ok(html.includes('Needs Review'));
});
test('student sign-in offers real Google authentication without a fake guest profile form', () => {
  const html = api.renderLogin('student');
  assert.ok(html.includes('Continue with Google Account'));
  assert.ok(html.includes('aria-modal="true"'));
  assert.ok(html.includes('Close sign-in'));
  assert.ok(!html.includes('Start Learning with Saarthi'));
  assert.ok(!html.includes('Student Full Name'));
});
