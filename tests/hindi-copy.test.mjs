import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readFileSync, readdirSync} from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({absWorkingDir:root,bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',
  stdin:{resolveDir:root,loader:'tsx',contents:`
  import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
  import {WebsiteProvider} from './src/context/WebsiteContext';
  import {DisplayLanguageContext} from './src/context/DisplayLanguageContext';
  import {ProtectedMaterial} from './src/components/ProtectedMaterial';
  import {ContactUsView} from './src/components/ContactUsView';
  export {hindiWebsiteCopy,untranslatedInterfaceTokens} from './src/data/hindiWebsiteCopy';
  export {WEBSITE_TEXT_CATALOGUE} from './src/data/websiteTextCatalogue';
  export {DEFAULT_WEBSITE_CONFIG} from './src/services/websiteConfig';
  export {resolveLocalizedCopy} from './src/services/localizedCopy';
  export function render(language){return renderToStaticMarkup(<WebsiteProvider><DisplayLanguageContext.Provider value={language}><ProtectedMaterial><p>PRIVATE FIXTURE</p></ProtectedMaterial><ContactUsView/></DisplayLanguageContext.Provider></WebsiteProvider>);}`},
  plugins:[{name:'no-network',setup(b){
    b.onResolve({filter:/AuthContext$/},()=>({path:'auth',namespace:'fixture'}));
    b.onResolve({filter:/CurriculumContext$/},()=>({path:'curriculum',namespace:'fixture'}));
    b.onResolve({filter:/services\/firebase$/},()=>({path:'firebase',namespace:'fixture'}));
    b.onResolve({filter:/^firebase\/firestore$/},()=>({path:'firestore',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:{
      auth:`export const useAuth=()=>({user:null,profile:null,isAdmin:false,openAuthModal:()=>{}});`,
      curriculum:`import {useContext} from 'react';import {DisplayLanguageContext} from './src/context/DisplayLanguageContext'; export const useCurriculum=()=>({language:useContext(DisplayLanguageContext),selectedClass:'Class 12'});`,
      firebase:`export const db={};export const handleFirestoreError=()=>{};export const OperationType={};`,
      firestore:`export const doc=()=>({});export const onSnapshot=()=>()=>{};export const runTransaction=()=>{throw Error('IO prohibited')};export const setDoc=()=>{throw Error('IO prohibited')};`
    }[a.path],resolveDir:root}));
  }}]});
const loaded={exports:{}};
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const api=loaded.exports;

test('all catalogued English interface copy has reviewed Hindi or an explicit technical exception',()=>{
  const missing=api.WEBSITE_TEXT_CATALOGUE.map(x=>x.text).filter(x=>/[A-Za-z]/.test(x)&&!/[\u0900-\u097f]/.test(x)&&!api.hindiWebsiteCopy[x]&&!api.untranslatedInterfaceTokens.has(x));
  assert.deepEqual([...new Set(missing)],[]);
});
test('Hindi sign-in gate and Contact form render real translated copy without exposing content',()=>{
  const html=api.render('hi');
  for(const label of ['अपनी अध्ययन सामग्री पढ़ने के लिए प्रवेश करें।','विद्यार्थी प्रवेश','आपका नाम *','ईमेल पता *','फोन नंबर (वैकल्पिक)','संदेश भेजें']) assert.ok(html.includes(label),label);
  assert.ok(!html.includes('PRIVATE FIXTURE'));
  assert.ok(!html.includes('Your Name *'));
  assert.ok(!html.includes('Phone Number (Optional)'));
  const english=api.render('en');assert.ok(english.includes('Your Name *'));assert.ok(english.includes('Student Sign In'));
});
test('translations preserve spaces, technical identities and administrator replacements/deletions',()=>{
  const config=structuredClone(api.DEFAULT_WEBSITE_CONFIG);
  assert.equal(api.resolveLocalizedCopy(config,'Thank you, ','hi'),'धन्यवाद, ');
  assert.equal(api.resolveLocalizedCopy(config,'email@example.com','hi'),'email@example.com');
  config.name='CUSTOM BRAND';
  assert.ok(api.resolveLocalizedCopy(config,'Generate with Sankatmochansaarthi','hi').includes('CUSTOM BRAND'));
  config.copy['Your Name *']={replacement:'CUSTOM LABEL',deleted:false};
  assert.equal(api.resolveLocalizedCopy(config,'Your Name *','hi'),'CUSTOM LABEL');
  config.copy['Your Name *'].deleted=true;
  assert.equal(api.resolveLocalizedCopy(config,'Your Name *','hi'),'');
});
test('English WebsiteText calls introduced in components cannot silently lack Hindi coverage',()=>{
  const missing=new Set();
  for(const file of readdirSync(new URL('../src/components/',import.meta.url)).filter(x=>x.endsWith('.tsx'))){
    const source=readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8');
    for(const m of source.matchAll(/(?:websiteText\(|original=\{)("(?:[^"\\]|\\.)*")/g)){
      const x=JSON.parse(m[1]);
      if(/[A-Za-z]/.test(x)&&!/[\u0900-\u097f]/.test(x)&&!api.hindiWebsiteCopy[x]&&!api.untranslatedInterfaceTokens.has(x))missing.add(x);
    }
  }
  assert.deepEqual([...missing],[]);
});
