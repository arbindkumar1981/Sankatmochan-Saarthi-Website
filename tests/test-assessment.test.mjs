import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({ stdin: { contents: "export * from './src/services/testAssessment'; export { INITIAL_TESTS, LEGACY_SUBJECTS, ALL_SUBJECTS } from './src/data/defaultCurriculum';", resolveDir: root, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', write: false });
const api = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('legacy published science tests match the current chapter without changing test identity', () => {
  for (const t of api.INITIAL_TESTS) {
    const mapped = api.mapLegacyTest(t, api.LEGACY_SUBJECTS, api.ALL_SUBJECTS);
    assert.equal(mapped.id, t.id);
    const subject = api.ALL_SUBJECTS.find(s => s.id === mapped.subjectId);
    assert.ok(subject, t.id);
    if (mapped.chapterId) assert.ok(subject.chapters.some(c => c.id === mapped.chapterId));
    assert.equal(mapped.approved, t.approved);
  }
});
test('legacy mapping never crosses boards or ambiguous course identities', () => {
  const t = api.INITIAL_TESTS[0];
  assert.equal(api.mapLegacyTest({ ...t, board: 'ICSE_ISC' }, api.LEGACY_SUBJECTS, api.ALL_SUBJECTS).subjectId, t.subjectId);
  const target = api.ALL_SUBJECTS.find(s => s.id === 'c10-science-2026');
  assert.equal(api.mapLegacyTest(t, api.LEGACY_SUBJECTS, [target, { ...target, id: 'duplicate' }]).subjectId, t.subjectId);
});
test('published seed assessment totals equal their actual question marks', () => {
  for (const t of api.INITIAL_TESTS) assert.equal(t.totalMarks, t.questions.reduce((sum, q) => sum + q.marks, 0), t.id);
});
test('structured generated questions become objective questions with bounded answer keys', () => {
  const q = { questionText: 'Choose oxygen', options: ['O2','CO2'], correctIndex: 0, explanation: 'O2 is oxygen.', marks: 2 };
  assert.equal(api.parseGeneratedQuestions(JSON.stringify({ questions: [q] }))[0].marks, 2);
  assert.equal(api.parseGeneratedQuestions('<think>private draft</think>\n' + JSON.stringify({ questions: [q] }))[0].marks, 2);
  assert.equal(api.parseGeneratedQuestions('```json\n' + JSON.stringify({ questions: [q] }) + '\n```')[0].correctIndex, 0);
  for (const bad of [{ ...q, correctIndex: 2 }, { ...q, marks: 0 }, { ...q, explanation: '' }, { ...q, options: ['only one'] }]) assert.throws(() => api.parseGeneratedQuestions(JSON.stringify({ questions: [bad] })));
  assert.throws(() => api.parseGeneratedQuestions('Unstructured notes'));
});

test('assessment matches only its exact active curriculum and topic', () => {
  const scope = {board:'CBSE',classGrade:'Class 12',stream:'Science',subjectId:'bio',chapterId:'ch',topicId:'topic'};
  const assessment = {...scope,approved:true,published:true};
  assert.equal(api.matchesAssessment(assessment,scope),true);
  for(const change of [{topicId:'other'},{topicId:undefined},{chapterId:'other'},{classGrade:'Class 11'},{subjectId:'chem'},{stream:'Commerce'},{board:'ICSE_ISC'}]) assert.equal(api.matchesAssessment(assessment,{...scope,...change}),false);
  assert.equal(api.matchesAssessment({...assessment,published:false},scope),false);
});

test('teacher presentation sample cannot cross a topic or hidden source', () => {
  const scope = {board:'CBSE',classGrade:'Class 12',stream:'Science',subjectId:'bio',chapterId:'ch',topicId:'topic'};
  const content = {...scope,approved:true,published:true,contentType:'detailed_notes',bodyText:'Exact topic notes'};
  assert.equal(api.scopedStyleSample([content],scope),'Exact topic notes');
  for(const change of [{topicId:'other'},{deleted:true},{status:'ARCHIVED'},{approved:false},{stream:'Commerce'},{classGrade:'Class 11'}]) assert.equal(api.scopedStyleSample([{...content,...change}],scope),'');
});
