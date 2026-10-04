import React from 'react';
const user={uid:'local-test-admin',isAnonymous:false,email:'admin@example.test',getIdToken:async()=>{throw new Error('External calls are disabled in the local test fixture.');}};
const profile={uid:user.uid,email:user.email,displayName:'Local Admin Test',role:'admin' as const,board:'CBSE',classGrade:'Class 10',stream:'General',preferredLanguage:'en'};
export const useAuth=()=>({user,profile,isAdmin:true,role:'admin',loading:false,authModalOpen:false,authModalInitialTab:'admin',openAuthModal:()=>{},closeAuthModal:()=>{},signOut:async()=>{},signInWithGoogle:async()=>{},signInAsGuestStudent:()=>{},updateStudentPreferences:async()=>{}});
export const AuthProvider=({children}:{children:React.ReactNode})=><>{children}</>;
