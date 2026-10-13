import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Exercise the real components and selection callbacks without Firebase IO.
const fixture = `let current; export const setup = value => current = value;
export const useCurriculum = () => current.curriculum;
export const useAuth = () => current.auth;
export const useWebsite = () => ({ config: current.config, text: value => value });
export const WebsiteText = ({original}) => original;`;
const result = await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  stdin: { resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'tsx', contents: `
    import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
    import {LearningSidebar} from './src/components/LearningSidebar';
    import {VerticalNav} from './src/components/VerticalNav';
    import {Header} from './src/components/Header';
    import {setup} from './src/context/CurriculumContext';
    export {DEFAULT_WEBSITE_CONFIG} from './src/services/websiteConfig';
    export {setup, LearningSidebar, VerticalNav, Header};
    export const render = (Component, props = {}) => renderToStaticMarkup(<Component {...props}/>);` },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'navigation-context-fixture', setup(builder) {
    builder.onResolve({ filter: /(?:CurriculumContext|AuthContext|WebsiteContext)$/ }, () => ({path:'contexts',namespace:'test-only'}));
    builder.onLoad({filter:/.*/,namespace:'test-only'}, () => ({contents:fixture,loader:'js'}));
  }}]
});
const loaded = { exports: {} };
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const api = loaded.exports;
function setup(overrides = {}) {
  const calls = [];
  const topic = {id:'topic',title:'Oxidation'};
  const chapter = {id:'chapter',title:'Chemical Reactions',chapterNumber:1,topics:[topic]};
  const subject = {id:'science',name:'Science',chapters:[chapter]};
  const curriculum = {selectedBoard:'CBSE',selectedClass:'Class 10',selectedStream:'Science',selectedSubject:subject,selectedChapter:chapter,selectedTopic:null,availableSubjects:[subject],activeModule:'detailed_notes',activeTab:'learning',language:'en',testResults:[],...overrides};
  for (const key of ['setSelectedBoard','setSelectedClass','setSelectedStream','setSelectedSubject','setSelectedChapter','setSelectedTopic','setActiveModule','setActiveTab','toggleLanguage']) curriculum[key] = value => calls.push([key,value]);
  const value = {curriculum,auth:{isAdmin:false,profile:null,openAuthModal:value=>calls.push(['auth',value])},config:structuredClone(api.DEFAULT_WEBSITE_CONFIG)};
  api.setup(value); return {...value,calls,subject,chapter,topic};
}
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element,...nodes(element.props?.children)];
}

test('curriculum controls live in the sidebar, with stream available only for senior classes', () => {
  setup();
  assert.equal(nodes(api.Header()).filter(x=>x.type==='select').length,0);
  assert.equal(nodes(api.LearningSidebar({})).filter(x=>x.type==='select').length,3);
  for (const selectedClass of ['Class 11','Class 12']) {
    setup({selectedClass});
    assert.equal(nodes(api.LearningSidebar({})).filter(x=>x.type==='select').length,4);
  }
  assert.match(api.render(api.LearningSidebar),/Curriculum Hierarchy/);
  assert.match(api.render(api.VerticalNav),/<details>/);
});

test('moved selectors and chapter/topic/full-chapter actions retain their context handlers', () => {
  const f = setup({selectedClass:'Class 12'});
  const tree = nodes(api.LearningSidebar({}));
  const selects = tree.filter(x=>x.type==='select');
  selects[0].props.onChange({target:{value:'ICSE'}});
  selects[1].props.onChange({target:{value:'Class 11'}});
  selects[2].props.onChange({target:{value:'Commerce'}});
  assert.deepEqual(f.calls.splice(0),[['setSelectedBoard','ICSE'],['setSelectedClass','Class 11'],['setSelectedStream','Commerce']]);
  tree.find(x=>x.type==='button'&&x.props.title==='Science').props.onClick();
  assert.deepEqual(f.calls.splice(0),[['setSelectedSubject',f.subject],['setSelectedChapter',f.chapter],['setSelectedTopic',null]]);
  selects[3].props.onChange({target:{value:'chapter'}});
  assert.deepEqual(f.calls.splice(0),[['setSelectedChapter',f.chapter],['setSelectedTopic',null]]);
  tree.find(x=>x.type==='button'&&x.props.title==='Oxidation').props.onClick();
  assert.deepEqual(f.calls.splice(0),[['setSelectedTopic',f.topic]]);
  tree.find(x=>x.type==='button'&&x.props['aria-pressed']===true&&!x.props.title).props.onClick();
  assert.deepEqual(f.calls.splice(0),[['setSelectedTopic',null]]);
});

test('managed modules, custom pages, and admin access keep their identities and actions', () => {
  const f = setup();
  const module = f.config.modules.find(x=>x.id==='detailed_notes');
  const tree = nodes(api.LearningSidebar({}));
  tree.find(x=>x.type==='button'&&x.props.title===module.label).props.onClick();
  assert.deepEqual(f.calls.splice(0),[['setActiveModule','detailed_notes']]);
  assert.ok(!nodes(api.LearningSidebar({showModules:false})).some(x=>x.type==='button'&&x.props.title===module.label));
  f.config.pages.push({id:'help',title:'Study help',body:'Support',hindiTitle:'',hindiBody:''});
  assert.ok(!nodes(api.VerticalNav()).some(x=>x.key==='admin'));
  nodes(api.VerticalNav()).find(x=>x.key==='page:help').props.onClick();
  assert.deepEqual(f.calls.splice(0),[['setActiveTab','page:help']]);
  f.auth.isAdmin=true;
  nodes(api.VerticalNav()).find(x=>x.key==='admin').props.onClick();
  assert.deepEqual(f.calls.splice(0),[['setActiveTab','admin']]);
  assert.match(api.render(api.VerticalNav),/aria-current="page"/);
});

test('authentication actions and Hindi curriculum fallbacks remain available', () => {
  const f=setup({language:'hi'});
  const buttons=nodes(api.Header()).filter(x=>x.type==='button');
  buttons[1].props.onClick();buttons[2].props.onClick();
  assert.deepEqual(f.calls,[['auth','student'],['auth','admin']]);
  assert.match(api.render(api.LearningSidebar),/Science/);
  assert.match(api.render(api.LearningSidebar),/Chemical Reactions/);
});
