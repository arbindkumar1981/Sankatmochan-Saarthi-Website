import {auth} from './firebase';
async function request(path:string,body?:unknown){
 const user=auth.currentUser;if(!user||user.isAnonymous)throw new Error('Sign in with your individual account.');
 const base=import.meta.env.VITE_SAARTHI_API_URL;if(!base)throw new Error('Administration service is not configured.');
 const token=await user.getIdToken();if(auth.currentUser!==user)throw new Error('Account changed. Reload.');
 const response=await fetch(`${base.replace(/\/$/,'')}/v1/control-center${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(30000)});
 if(auth.currentUser!==user)throw new Error('Account changed. Reload.');
 if(!response.ok)throw new Error(response.status===409?'The version changed, a seat is unavailable, or approval is required. Reload and compare.':response.status===403?'Check your assigned role, verified email and multi-factor sign-in.':'Operation unavailable. Reload to check whether it completed.');
 return {response,user};
}
export async function controlApi<T>(path:string,body?:unknown):Promise<T>{const {response,user}=await request(path,body);const result=await response.json() as T;if(auth.currentUser!==user)throw new Error('Account changed. Reload.');return result;}
export async function controlBlob(path:string):Promise<Blob>{const {response,user}=await request(path);const blob=await response.blob();if(auth.currentUser!==user)throw new Error('Account changed. Reload.');return blob;}
