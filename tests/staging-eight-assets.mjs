/** Explicit, nonproduction API→Firestore→renderer acceptance runner.
 * Usage: node tests/staging-eight-assets.mjs approved-staging.json
 * Tokens are supplied only through SAARTHI_STAGING_OWNER_TOKEN / OTHER_TOKEN.
 * This does not claim browser sign-in/click coverage or verify deployed SHAs.
 */
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {randomUUID} from 'node:crypto';
const config = JSON.parse(await readFile(process.argv[2], 'utf8'));
const api = new URL(config.apiUrl), website = new URL(config.websiteUrl);
const forbidden = ['sankatmochansaarthi.in', 'www.sankatmochansaarthi.in', 'sankatmochan-509100.web.app', 'sankatmochan-509100.firebaseapp.com'];
if (config.environment !== 'staging' || config.isolationApproved !== true ||
    !/^[a-z0-9-]*staging[a-z0-9-]*$/.test(config.firebaseProjectId) ||
    !/^issue87-[a-zA-Z0-9_-]+$/.test(config.ownerUid) ||
    !/^issue87-[a-zA-Z0-9_-]+$/.test(config.otherUid) || config.ownerUid === config.otherUid ||
    !/^[a-f0-9]{40}$/.test(config.backendCommit) || !/^[a-f0-9]{40}$/.test(config.websiteCommit) ||
    [api,website].some(url => url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      forbidden.includes(url.hostname) || url.hostname.includes('247863708315') || url.hostname.includes('sankatmochan-saarthi-v3-git'))) {
  throw new Error('BLOCKED: requires an approved isolated staging pair and dedicated issue87 synthetic users; production is forbidden.');
}
const ownerToken = process.env.SAARTHI_STAGING_OWNER_TOKEN;
const otherToken = process.env.SAARTHI_STAGING_OTHER_TOKEN;
if (!ownerToken || !otherToken || ownerToken === otherToken) throw new Error('BLOCKED: two distinct staging ID tokens are required.');
const root = fileURLToPath(new URL('../',import.meta.url));
const bundle = await build({absWorkingDir:root,entryPoints:['./src/services/teacherArtifact.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {TEACHER_ASSETS,validateTeacherArtifact,encodeTeacherArtifact,readTeacherArtifact,teacherArtifactText} = await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const runId = `issue87-${randomUUID()}`;
const report = {runId,startedAt:new Date().toISOString(),environment:'staging',backendCommit:config.backendCommit,websiteCommit:config.websiteCommit,
  revisionVerification:'REQUIRED separately: configured commits are intended revisions, not observed proof',results:[]};
const headers = token => ({'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})});
// Private staging Cloud Run checks this separate IAM token; Firebase identity
// remains in Authorization and is still independently checked by the API.
const apiHeaders = token => ({...headers(token),...(process.env.SAARTHI_STAGING_RUN_TOKEN
  ? {'X-Serverless-Authorization':`Bearer ${process.env.SAARTHI_STAGING_RUN_TOKEN}`} : {})});
async function checked(url, options, allowed=[200]) {
  const res = await fetch(url,{...options,signal:AbortSignal.timeout(600000),redirect:'error'});
  if (!allowed.includes(res.status)) throw new Error(`HTTP_${res.status}`);
  return res;
}
// Prove rejection before generation. Do not persist or print response error bodies.
await checked(new URL('/v1/website/teacher/generate',api),{method:'POST',headers:apiHeaders(),body:JSON.stringify({class_level:'X',subject:'Science',asset_type:'DETAILED_NOTES',topic_id:runId})},[401,403]);
await checked(website,{method:'GET'});
for (const asset_type of TEACHER_ASSETS) {
  let step='generate'; const started=Date.now();
  try {
    const request={board:'CBSE',class_level:'X',subject:'Science',language:'ENGLISH',asset_type,topic_id:`${runId}-${asset_type}`,chapter:'Heredity and Evolution',topic:'Heredity'};
    const generated=await checked(new URL('/v1/website/teacher/generate',api),{method:'POST',headers:apiHeaders(ownerToken),body:JSON.stringify(request)});
    const data=await generated.json();
    step='validate';
    const asset=validateTeacherArtifact(data,request);
    if (!data.quality_checks || !Object.keys(data.quality_checks).length || Object.values(data.quality_checks).some(value=>value!==true)) throw new Error('QUALITY_GATE');
    const body=encodeTeacherArtifact(asset);
    const id=`${runId}-${asset_type}`;
    const url=`https://firestore.googleapis.com/v1/projects/${config.firebaseProjectId}/databases/(default)/documents/users/${config.ownerUid}/saved_materials/${id}`;
    const material={id,title:`Issue 87 synthetic ${asset_type}`,body,curriculum:'CBSE Class X Science',savedAt:new Date().toISOString()};
    step='persist';
    await checked(url,{method:'PATCH',headers:headers(ownerToken),body:JSON.stringify({fields:Object.fromEntries(Object.entries(material).map(([key,value])=>[key,{stringValue:value}]))})});
    step='authorized_retrieval';
    const stored=await (await checked(url,{headers:headers(ownerToken)})).json();
    const loaded=readTeacherArtifact(stored.fields.body.stringValue);
    if (JSON.stringify(loaded)!==JSON.stringify(asset)) throw new Error('ROUND_TRIP');
    step='render';
    if (!teacherArtifactText(loaded).trim()) throw new Error('EMPTY_RENDER');
    step='deny_other_user';
    await checked(url,{headers:headers(otherToken)},[401,403]);
    step='deny_signed_out';
    await checked(url,{headers:headers()},[401,403]);
    report.results.push({asset_type,status:'PASS',durationMs:Date.now()-started,documentId:id});
  } catch (error) {
    // Never record model content, identity, ID tokens, or server error bodies.
    report.results.push({asset_type,status:'FAIL',step,error:/^HTTP_\d+$/.test(error.message)?error.message:'VALIDATION_OR_TRANSPORT_FAILURE',durationMs:Date.now()-started});
  }
  console.log(`${asset_type}: ${report.results.at(-1).status}`);
}
report.completedAt=new Date().toISOString();
await writeFile(`${runId}-evidence.json`,JSON.stringify(report,null,2)+'\n');
process.exitCode=report.results.every(row=>row.status==='PASS')?0:1;
