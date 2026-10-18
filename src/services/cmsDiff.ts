import type {CmsEntry} from './publishedCms';
export function draftDiff(published:CmsEntry[],draft:CmsEntry[]){
 const before=new Map(published.map(row=>[row.id,row])),after=new Map(draft.map(row=>[row.id,row]));
 return [...new Set([...before.keys(),...after.keys()])].sort().flatMap(id=>{
 const old=before.get(id),next=after.get(id);const fields=[...new Set([...Object.keys(old||{}),...Object.keys(next||{})])].filter(key=>JSON.stringify((old as unknown as Record<string,unknown>)?.[key])!==JSON.stringify((next as unknown as Record<string,unknown>)?.[key])).sort();
 return fields.length?[{id,before:old,after:next,kind:!old?'added':!next?'removed':'changed',fields}]:[];
 });
}
