import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { controlApi } from '../services/controlApi';
import { ControlAudit } from './ControlAudit';
import { ControlCenter } from './ControlCenter';
import { AdminAccounts } from './AdminAccounts';
import { SecureAssessment } from './SecureAssessment';
import { NotesManagement } from './NotesManagement';
export function AdminWorkspace() {
  const [session, setSession] = useState<{role: string; capabilities: string[]}>( {role:'',capabilities:[]} );
  const [error,setError] = useState('');
  useEffect(() => { let generation=0; const unsubscribe = auth.onIdTokenChanged(async () => { const current=++generation; setSession({role:'',capabilities:[]}); setError(''); try { const next=await controlApi<typeof session>('/session'); if(current===generation) setSession(next); } catch { if(current===generation) setError('Verify your email and authenticator, then confirm your identity.'); } }); return () => {++generation; unsubscribe();}; }, []);
  return <div className="w-full min-w-0 space-y-5"><AdminAccounts />{error && <p role="status">{error}</p>}{session.role && <p>Signed in role: {session.role.replaceAll('_',' ')}</p>}{session.capabilities.includes('cms.read') && <ControlCenter />}{session.capabilities.includes('audit.read') && <ControlAudit />}
{session.capabilities.includes('assessment.review') && <SecureAssessment academic />}
{session.capabilities.includes('notes.edit') && <NotesManagement />}</div>;
}
