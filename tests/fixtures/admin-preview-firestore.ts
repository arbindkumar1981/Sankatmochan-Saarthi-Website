const database=new Map<string,any>(JSON.parse(localStorage.getItem('saarthi_admin_local_fixture')||'[]'));
const listeners=new Set<{reference:any; callback:(snapshot:any)=>void}>();
export const doc=(_db:any,...parts:string[])=>({kind:'doc',path:parts.join('/')});
export const collection=(_db:any,...parts:string[])=>({kind:'collection',path:parts.join('/')});
export const where=(key:string,operator:string,value:any)=>({key,operator,value});
export const limit=(value:number)=>({limit:value});
export const query=(reference:any,...constraints:any[])=>({...reference,constraints});
const snapshot=(reference:any)=>{
 if(reference.kind==='doc')return {exists:()=>database.has(reference.path),data:()=>database.get(reference.path)};
 let docs=[...database.entries()].filter(([key])=>key.startsWith(reference.path+'/')&&!key.slice(reference.path.length+1).includes('/')).map(([key,value])=>({id:key.split('/').at(-1),data:()=>structuredClone(value),ref:{kind:'doc',path:key}}));
 for(const constraint of reference.constraints||[]) {if(constraint.key)docs=docs.filter(d=>d.data()[constraint.key]===constraint.value);if(constraint.limit)docs=docs.slice(0,constraint.limit);}
 return {docs,empty:!docs.length,forEach:(callback:any)=>docs.forEach(callback)};
};
const notify=()=>{localStorage.setItem('saarthi_admin_local_fixture',JSON.stringify([...database]));for(const listener of listeners)listener.callback(snapshot(listener.reference));};
export const onSnapshot=(reference:any,callback:any)=>{const listener={reference,callback};listeners.add(listener);queueMicrotask(()=>{if(listeners.has(listener))callback(snapshot(reference));});return ()=>listeners.delete(listener);};
export const getDoc=async(reference:any)=>snapshot(reference);
export const getDocs=async(reference:any)=>snapshot(reference);
export const setDoc=async(reference:any,data:any,options?:any)=>{database.set(reference.path,structuredClone(options?.merge?{...database.get(reference.path),...data}:data));notify();};
export const updateDoc=async(reference:any,data:any)=>setDoc(reference,data,{merge:true});
export const serverTimestamp=()=>new Date().toISOString();
export const increment=(value:number)=>value;
export const runTransaction=async(_db:any,callback:any)=>{
 const pending:any[]=[];await callback({get:async(reference:any)=>snapshot(reference),set:(reference:any,data:any)=>pending.push({reference,data})});
 for(const entry of pending)database.set(entry.reference.path,structuredClone(entry.data));notify();
};
