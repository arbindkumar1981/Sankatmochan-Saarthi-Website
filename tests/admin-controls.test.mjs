import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const result = await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  stdin: { contents: "export * from './src/services/websiteConfig'; export * from './src/services/adminValidation'; export { notesPdfHtml } from './src/services/notesPdf'; export { ALL_SUBJECTS } from './src/data/defaultCurriculum';", resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false
});
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const config = () => structuredClone(api.DEFAULT_WEBSITE_CONFIG);
const subject = () => structuredClone(api.ALL_SUBJECTS.find(s => s.classes.includes('Class 10') && s.chapters.length));
const assessment = () => ({ id: 'exam-1', title: 'Practice', board: 'CBSE', classGrade: 'Class 10', subjectId: 'science', approved: true, published: true, durationMinutes: 15, totalMarks: 2, passingMarks: 1, questions: [{ id: 'q1', questionText: 'Select the correct statement', options: ['A', 'B'], correctIndex: 1, explanation: 'B is correct.', marks: 2 }] });

test('unpublished and archived resources stay hidden, including bundled resources', () => {
  const exam = assessment();
  assert.equal(api.assetVisibility('tests', exam).hidden, false);
  assert.equal(api.assetVisibility('tests', { ...exam, published: false }).hidden, true);
  assert.equal(api.assetVisibility('tests', api.archiveRecord('tests', exam)).hidden, true);
  assert.equal(api.assetVisibility('tests', api.restoreRecord('tests', api.archiveRecord('tests', exam))).hidden, false);
  assert.equal(api.assetVisibility('notices', { id: 'n1', active: false }).hidden, true);
});

test('visibility marker identities remain bounded and separate collections', async () => {
  const marker = await api.assetMarker('tests', 'x'.repeat(128));
  assert.match(marker, /^asset-[a-f0-9]{64}$/);
  assert.notEqual(marker, await api.assetMarker('learning_contents', 'x'.repeat(128)));
});

test('website labels and custom options do not change existing curriculum identities', () => {
  const next = config(), old = config();
  next.name = 'My Saarthi'; next.classes[1].label = 'Grade Ten'; next.boards[0].label = 'Central Board';
  next.classes.push({ id: 'class-extra', label: 'Class VIII', hindiLabel: 'कक्षा 8' });
  api.validateWebsiteConfig(next);
  assert.deepEqual(next.classes.slice(0, 4).map(x => x.id), old.classes.map(x => x.id));
  assert.equal(api.optionLabel(next.classes, 'Class 10'), 'Grade Ten');
  assert.equal(api.supportedTeacherClass('Class 10'), true);
  assert.equal(api.supportedTeacherClass('class-extra'), false);
});

test('every class and board selector remains isolated, including new admin-added subjects', () => {
  for (const grade of ['Class 9','Class 10','Class 11','Class 12']) {
    for (const stream of ['General','Science','Commerce','Humanities']) {
      const visible = api.subjectsForSelection(api.ALL_SUBJECTS,'CBSE',grade,stream);
      assert.ok(visible.every(s => s.classes.includes(grade) && (s.board || 'CBSE') === 'CBSE'));
      assert.equal(api.subjectsForSelection(api.ALL_SUBJECTS,'new-board',grade,stream).length,0);
    }
  }
  const added={...subject(), id:'custom-subject', board:'new-board', classes:['class-extra'], stream:'General'};
  assert.equal(api.subjectsForSelection([added],'new-board','class-extra','General')[0].id,'custom-subject');
  assert.equal(api.subjectsForSelection([added],'CBSE','class-extra','General').length,0);
  assert.equal(api.subjectsForSelection([added],'new-board','Class 10','General').length,0);
});

test('custom learning resources can be added without replacing interactive module identities', () => {
  const next=config();next.modules.push({id:'admin-resource',label:'Worksheets',hindiLabel:'कार्यपत्रक'});
  api.validateWebsiteConfig(next);
  assert.equal(api.optionLabel(next.modules,'admin-resource'),'Worksheets');
  assert.ok(next.modules.some(x=>x.id==='test_yourself'));
});

test('options can be hidden and restored while keeping the same identities', () => {
  const next = config(); next.boards[0].deleted = true;
  assert.equal(api.activeOptions(next.boards).some(x => x.id === 'CBSE'), false);
  next.boards[0].deleted = false;
  assert.equal(api.activeOptions(next.boards).some(x => x.id === 'CBSE'), true);
  const oldId = next.boards[0].id;
  assert.equal(oldId, 'CBSE');
});

test('unsafe images, duplicate identities and empty selectors are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'http://example.com/image.png', '//example.com/a.png', '/\\example.com/a.png', 'https://password:secret@example.com/logo.png']) assert.equal(api.safeImageUrl(url), false, url);
  for (const url of ['/logo.png', 'https://example.com/logo.png', '']) assert.equal(api.safeImageUrl(url), true, url);
  const duplicate = config(); duplicate.boards.push(duplicate.boards[0]); assert.throws(() => api.validateWebsiteConfig(duplicate));
  const empty = config(); empty.classes.forEach(x => x.deleted = true); assert.throws(() => api.validateWebsiteConfig(empty));
  const tool = config(); tool.navigation.push({ id: 'execute-code', label: 'Run', hindiLabel: '' }); assert.throws(() => api.validateWebsiteConfig(tool));
});

test('public text deletion, replacement, restore and automatic branding work in both languages', () => {
  const next = config(); next.name = 'New Academy';
  assert.equal(api.resolveCopy(next, 'Generate with Sankatmochansaarthi'), 'Generate with New Academy');
  next.copy['About Us'] = { replacement: 'Our Mission' }; assert.equal(api.resolveCopy(next, 'About Us'), 'Our Mission');
  next.copy['About Us'].deleted = true; assert.equal(api.resolveCopy(next, 'About Us'), '');
  delete next.copy['About Us']; assert.equal(api.resolveCopy(next, 'About Us'), 'About Us');
  next.copy['संपर्क करें'] = { replacement: 'हमसे बात करें' }; assert.equal(api.resolveCopy(next, 'संपर्क करें'), 'हमसे बात करें');
  assert.equal(api.resolveCopy(next, 'toString'), 'toString');
});

test('deleting the final chapter stays deleted after a persisted override reload', () => {
  const seed = subject(), changed = structuredClone(seed);
  changed.chapters.forEach(ch => ch.deleted = true);
  const merged = api.mergeCurriculum([seed], [{ id: seed.id, data: { kind: 'subject', subject: changed, chaptersExplicit: true } }]);
  assert.equal(api.activeSubject(merged[0]).chapters.length, 0);
  merged[0].chapters[0].deleted = false;
  assert.equal(api.activeSubject(merged[0]).chapters[0].id, seed.chapters[0].id);
  const empty = api.mergeCurriculum([seed], [{ id: seed.id, data: { kind: 'subject', subject: { ...seed, chapters: [] }, chaptersExplicit: true } }]);
  assert.equal(empty[0].chapters.length, 0);
});

test('older metadata-only overrides retain bundled chapters; renames keep teacher identity', () => {
  const seed = subject();
  const merged = api.mergeCurriculum([seed], [{ id: seed.id, data: { kind: 'subject', subject: { ...seed, name: 'New display label', chapters: [] } } }]);
  assert.deepEqual(merged[0].chapters, seed.chapters);
  assert.equal(merged[0].teacherSubject, seed.name);
  assert.equal(merged[0].name, 'New display label');
});

test('subject and topic soft deletion preserve history identities and restore content', () => {
  const seed = subject(), changed = structuredClone(seed);
  changed.deleted = true;
  let merged = api.mergeCurriculum([seed], [{ id: seed.id, data: { kind: 'subject', subject: changed, deleted: true, chaptersExplicit: true } }]);
  assert.equal(merged[0].deleted, true); assert.deepEqual(merged[0].chapters, seed.chapters);
  changed.deleted = false;
  merged = api.mergeCurriculum([seed], [{ id: seed.id, data: { kind: 'subject', subject: changed, deleted: false, chaptersExplicit: true } }]);
  assert.equal(merged[0].deleted, false);
  const chapter = changed.chapters.find(ch => ch.topics.length);
  if (chapter) { chapter.topics[0].deleted = true; const active = api.activeSubject(changed); assert.equal(active.chapters.find(ch => ch.id === chapter.id).topics.some(t => t.id === chapter.topics[0].id), false); }
});

test('curriculum rejects ambiguous IDs and invalid chapter ordering', () => {
  const seed = subject(); api.validateSubject(seed);
  seed.chapters[0].chapterNumber = 0; assert.throws(() => api.validateSubject(seed));
  const duplicate = subject(); duplicate.chapters.push(structuredClone(duplicate.chapters[0])); assert.throws(() => api.validateSubject(duplicate));
});

test('archive and restore preserve assessment questions and prior student history', () => {
  const exam = assessment(), result = { testId: exam.id, score: 2, answers: [{ questionId: 'q1', correctOption: 1 }] }, history = structuredClone(result);
  const archived = api.archiveRecord('tests', exam);
  assert.equal(archived.published, false); assert.equal(archived.approved, false); assert.equal(archived.deleted, true);
  assert.deepEqual(archived.questions, exam.questions);
  const restored = api.restoreRecord('tests', archived);
  assert.equal(restored.published, true); assert.equal(restored.approved, true); assert.equal(restored.id, exam.id);
  assert.deepEqual(result, history); assert.equal(exam.published, true);
});

test('notices restore their prior visibility; uncertain legacy content stays unpublished', () => {
  const notice = { id: 'notice-1', title: 'Welcome', message: 'Welcome!', category: 'academic', active: true };
  const archived = api.archiveRecord('notices', notice); assert.equal(archived.active, false);
  assert.equal(api.restoreRecord('notices', archived).active, true);
  assert.equal(api.restoreRecord('tests', { id: 'old', deleted: true }).published, false);
});

test('invalid objective answers, question IDs, marks and unapproved publication are rejected', () => {
  api.validateAdminRecord('tests', assessment());
  for (const mutate of [x => x.questions[0].correctIndex = 2, x => x.totalMarks = 50, x => x.questions[0].marks = -1, x => x.approved = false, x => x.questions.push(x.questions[0])]) {
    const exam = assessment(); mutate(exam); assert.throws(() => api.validateAdminRecord('tests', exam));
  }
});

test('PDF branding is escaped along with notes and metadata', () => {
  const html = api.notesPdfHtml('Title', 'Prepared notes', ['CBSE'], '<img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<img src=x')); assert.ok(html.includes('&lt;img'));
});
