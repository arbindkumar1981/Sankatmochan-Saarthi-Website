import { useWebsite } from '../context/WebsiteContext';
import { WebsiteText } from '../context/WebsiteContext';
import React, {useEffect,useState} from 'react';
import {useCurriculum} from '../context/CurriculumContext';
import {learningApi} from '../services/learningApi';
type Draft = {id:string;source_id:string;body:string;reviewed_body?:string;status:string;revision:number;scope:Record<string,string>;source_metadata:{title:string}};
export function KnowledgeReview() {
  const { text: websiteText } = useWebsite();
  const {learningContents,deletedAssetIds,knowledgeImportStatus} = useCurriculum();
  const [drafts,setDrafts] = useState<Draft[]>([]);
  const [contentId,setContentId] = useState('');
  const [selectedId,setSelectedId] = useState('');
  const [body,setBody] = useState(''); const [rights,setRights] = useState('');
  const [checks,setChecks] = useState([false,false,false,false]);
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState('');
  const selected = drafts.find(d=>d.id===selectedId);
  const sources = learningContents.filter(c=>!c.deleted && c.status!=='ARCHIVED' && !deletedAssetIds.has(`learning_contents/${c.id}`));
  const load = () => learningApi<Draft[]>('/knowledge/drafts').then(setDrafts);
  useEffect(()=>{let active=true; void learningApi<Draft[]>('/knowledge/drafts').then(rows=>{if(active)setDrafts(rows);}).catch(e=>{if(active)setMessage(e.message);});return()=>{active=false;};},[knowledgeImportStatus]);
  const choose = (id:string) => {const draft=drafts.find(d=>d.id===id);setSelectedId(id);setBody(draft?.reviewed_body||draft?.body||'');setRights('');setChecks([false,false,false,false]);};
  async function run(action:()=>Promise<unknown>,success:string){if(busy)return;setBusy(true);setMessage('');try{await action();choose('');await load();setMessage(success);}catch(e){setMessage(e instanceof Error?e.message:'Operation failed.');}finally{setBusy(false);}}
  return <section className="space-y-4 border rounded-2xl p-4">
    <h3 className="font-bold"><WebsiteText original={"Verified Knowledge review"} /></h3><p className="text-sm"><WebsiteText original={"Import notes as drafts. Students and the Teacher Agent use them only after your review. Scanned PDFs require readable text."} /></p>
    {knowledgeImportStatus && <p role="status" className="border p-3 rounded">{knowledgeImportStatus}</p>}
    <label className="block"><WebsiteText original={"Uploaded material"} /><select value={contentId} onChange={e=>setContentId(e.target.value)} className="border p-2 w-full"><option value=""><WebsiteText original={"Choose notes"} /></option>{sources.map(c=><option key={c.id} value={c.id}>{c.classGrade} · {c.subjectName} · {c.chapterTitle} · {c.topicTitle||c.title}</option>)}</select></label>
    <button disabled={!contentId||busy} onClick={()=>void run(()=>learningApi('/knowledge/import',{contentId}),'Draft saved. Select it below to review.')} className="border rounded p-3"><WebsiteText original={"Import for KB review"} /></button>
    <label className="block"><WebsiteText original={"Review draft"} /><select value={selectedId} onChange={e=>choose(e.target.value)} className="border p-2 w-full"><option value=""><WebsiteText original={"Choose draft"} /></option>{drafts.map(d=><option key={d.id} value={d.id}>{d.source_metadata.title} · {d.status}<WebsiteText original={"· revision"} />{d.revision}</option>)}</select></label>
    {selected && <><p className="text-sm">{Object.values(selected.scope).filter(Boolean).join(' · ')}</p><label className="block"><WebsiteText original={"Reviewed academic content"} /><textarea value={body} maxLength={120000} onChange={e=>setBody(e.target.value)} rows={12} className="border w-full p-3"/></label><label className="block"><WebsiteText original={"Rights / authorship basis"} /><textarea value={rights} maxLength={2000} onChange={e=>setRights(e.target.value)} placeholder={websiteText("Record authorship or permission and the references checked.")} className="border w-full p-3"/></label>
      {['I checked factual accuracy and answer keys.','I checked the selected curriculum and topic.','I have permission to store and use this content.','I removed student/personal information.'].map((label,i)=><label key={label} className="block"><input type="checkbox" checked={checks[i]} onChange={e=>setChecks(previous=>previous.map((v,j)=>j===i?e.target.checked:v))}/> {websiteText(label)}</label>)}
      <button disabled={busy||!checks.every(Boolean)||body.trim().length<40||rights.trim().length<10} onClick={()=>void run(()=>learningApi(`/knowledge/${selected.id}/review`,{revision:selected.revision,action:'VERIFY',reviewedBody:body,rightsBasis:rights,confirmAccuracy:checks[0],confirmCurriculum:checks[1],confirmRights:checks[2],confirmNoPersonalData:checks[3]}),'Knowledge verified. Only the current published source is used for generation.')} className="bg-emerald-700 text-white rounded p-3"><WebsiteText original={"Verify for Knowledge Base"} /></button>
      <button disabled={busy} onClick={()=>void run(()=>learningApi(`/knowledge/${selected.id}/review`,{revision:selected.revision,action:'REJECT'}),'Draft rejected.')} className="border rounded p-3 ml-2"><WebsiteText original={"Reject"} /></button></>}
    {selected?.status === 'VERIFIED' && <button disabled={busy} onClick={()=>void run(()=>learningApi(`/knowledge/${selected.id}/publish`,{revision:selected.revision}),'Reviewed material published. Students can now open it.')} className="bg-emerald-700 text-white rounded p-3"><WebsiteText original={"Publish reviewed material"} /></button>}
    {message && <p role="status" className="border p-3 rounded">{message}</p>}
  </section>;
}
