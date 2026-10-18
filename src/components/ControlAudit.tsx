import React, {useEffect,useState} from 'react';
import {controlApi} from '../services/controlApi';
import {auth} from '../services/firebase';
type Event={id:string;actor:string;role:string;action:string;target:string;timestamp:number;beforeRevision:number;afterRevision:number};
export function ControlAudit(){
 const [rows,setRows]=useState<Event[]>([]),[cursor,setCursor]=useState<string|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>auth.onAuthStateChanged(()=>{setRows([]);setCursor(null);}),[]);
 const load=async()=>{setBusy(true);setError('');try{const value=await controlApi<{rows:Event[];next:string|null}>(`/audit${cursor?`?after=${encodeURIComponent(cursor)}`:''}`);setRows(old=>cursor?[...old,...value.rows]:value.rows);setCursor(value.next);}catch{setError('Audit history is unavailable for this session.');}finally{setBusy(false);}};
 return <section aria-label="Security audit" className="admin-console space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-2xl font-bold">Security & audit history</h2><p>Read-only server events. Student answers, passwords and authenticator secrets are excluded.</p>{error&&<p role="alert">{error}</p>}<button disabled={busy} onClick={()=>void load()}>Load {cursor?'older ':''}audit events</button>{!rows.length&&<p>No events loaded.</p>}<ul className="space-y-3">{rows.map(row=><li key={row.id} className="break-words rounded border p-3"><p>{row.action} · {new Date(row.timestamp*1000).toLocaleString()}</p><p>Actor {row.actor} ({row.role})</p><p>Target {row.target} · revision {row.beforeRevision} → {row.afterRevision}</p></li>)}</ul></section>;
}
