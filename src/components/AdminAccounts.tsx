import React, { useEffect, useState } from 'react';
import { type MultiFactorResolver, type TotpSecret } from 'firebase/auth';
import { auth } from '../services/firebase';
import { controlApi } from '../services/controlApi';
import { adminSignIn, adminReauthenticate, enrollSecret, completeEnrollment, completeChallenge } from '../services/adminMfa';

const roles = ['super_admin','website_admin','academic_admin','content_admin','user_admin','security_audit'];
type Roster = { capabilities: string[]; revision: number; seats: Record<string,number>; members: Record<string,{role: string; enabled: boolean}>; invitations: Record<string,{role: string; expiresAt: number}> };
export function AdminAccounts() {
  const [roster, setRoster] = useState<Roster>();
  const [email, setEmail] = useState(''); const [role, setRole] = useState('content_admin');
  const [invitation, setInvitation] = useState(''); const [newInvite, setNewInvite] = useState('');
  const [code, setCode] = useState(''); const [secret, setSecret] = useState<TotpSecret>();
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null); const [factor, setFactor] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const execute = async (work: () => Promise<void>) => { setBusy(true); setError(''); try { await work(); } catch (e) { setError(e instanceof Error ? e.message : 'Operation unavailable.'); } finally { setBusy(false); setCode(''); } };
  useEffect(() => auth.onAuthStateChanged(() => { setRoster(undefined); setSecret(undefined); setResolver(null); setCode(''); setNewInvite(''); }), []);
  const reload = async () => setRoster(await controlApi<Roster>('/accounts'));
  const challenge = (next: MultiFactorResolver | null) => { setResolver(next); setFactor(next?.hints.find(item => item.factorId === 'totp')?.uid || ''); };
  const update = (target: string, action: string, assignedRole?: string) => execute(async () => {
    if (!roster || !window.confirm(`Confirm ${action.replaceAll('_', ' ')} for this administrator?`)) return;
    await controlApi('/accounts/update', { revision: roster.revision, target, action, ...(assignedRole ? {role: assignedRole} : {}) }); await reload();
  });
  return <section aria-label="Administrator accounts" className="admin-console space-y-4 rounded-2xl border bg-white p-4 sm:p-6">
    <h2 className="text-2xl font-bold">Administrator accounts & secure access</h2>
    <p>Ten individual seats: 1 Super, 2 Website, 2 Academic, 3 Content, 1 User Management and 1 Security/Audit.</p>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
    {busy && <p role="status">Working…</p>}
    <fieldset disabled={busy} className="flex flex-wrap gap-3"><legend className="font-semibold">Multi-factor authentication</legend>
      <button onClick={() => void execute(async () => challenge(await adminSignIn()))}>Sign in to administrator account</button>
      <button onClick={() => void execute(async () => challenge(await adminReauthenticate()))}>Confirm identity again</button>
      <button onClick={() => void execute(async () => setSecret(await enrollSecret()))}>Set up authenticator</button>
      {secret && <div className="w-full rounded border p-3"><p>Add this setup key to your authenticator. It stays only in this view.</p><output className="break-all">{secret.secretKey}</output><p>After enrollment, sign in again with MFA before accepting an invitation.</p></div>}
      {resolver && <label>Authenticator<select value={factor} onChange={e => setFactor(e.target.value)}>{resolver.hints.filter(item => item.factorId === 'totp').map(item => <option value={item.uid} key={item.uid}>{item.displayName || 'Authenticator'}</option>)}</select></label>}
      {(secret || resolver) && <><label>Six-digit code<input autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></label><button onClick={() => void execute(async () => { if (resolver) { await completeChallenge(resolver, code, factor); setResolver(null); } else if (secret) { await completeEnrollment(secret, code); setSecret(undefined); } })}>Verify authenticator</button><button onClick={() => {setSecret(undefined); setResolver(null); setCode('');}}>Cancel</button></>}
    </fieldset>
    <fieldset disabled={busy} className="flex flex-wrap gap-3"><legend>Accept your invitation</legend><label>Invitation ID<input value={invitation} onChange={e => setInvitation(e.target.value)} /></label><button onClick={() => void execute(async () => { await controlApi('/accounts/accept', {invitation}); setInvitation(''); await reload(); })}>Activate my administrator access</button></fieldset>
    <button disabled={busy} onClick={() => void execute(reload)}>Load account roster</button>
    {roster && <><p>Roster revision {roster.revision}. Disabled seats remain reserved; revocation releases the seat.</p>
      {roster.capabilities.includes('accounts.invite') && <form onSubmit={e => {e.preventDefault(); void execute(async () => { const result = await controlApi<{invitation: string}>('/accounts/invite', {revision: roster.revision, email, role}); setNewInvite(result.invitation); setEmail(''); await reload(); });}} className="flex flex-wrap gap-3">
      <label>Administrator email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Invitation role<select value={role} onChange={e => setRole(e.target.value)}>{roles.map(item => <option key={item}>{item}</option>)}</select></label><button disabled={busy}>Create invitation</button></form>}
      {newInvite && <p role="status" className="break-all">Invitation ID: {newInvite}. Share securely with the invited colleague. It expires in 24 hours and requires their matching verified email and MFA.</p>}
      <ul className="grid gap-3 lg:grid-cols-2">{Object.entries(roster.members).map(([uid,row]) => <li key={uid} className="min-w-0 space-y-2 rounded border p-3"><p className="break-all">{uid}</p><p>{row.role} · {row.enabled ? 'Active' : 'Inactive'}</p><label>Assigned role<select aria-label={`Assigned role for ${uid}`} value={row.role} disabled={busy || row.role === 'super_admin' || !roster.capabilities.includes('accounts.manage')} onChange={e => void update(uid,'role',e.target.value)}>{roles.map(item => <option key={item}>{item}</option>)}</select></label><div className="flex flex-wrap gap-3"><button disabled={busy || !roster.capabilities.includes('accounts.manage')} onClick={() => void update(uid,row.enabled ? 'deactivate' : 'activate')}>{row.enabled ? 'Deactivate' : 'Activate'}</button><button disabled={busy || !roster.capabilities.includes('accounts.manage')} onClick={() => void update(uid,'revoke')}>Revoke access</button></div></li>)}</ul>
      <h3 className="font-semibold">Pending invitations</h3>{Object.entries(roster.invitations).map(([id,row]) => <div key={id} className="flex flex-wrap gap-3"><span>{row.role} · expires {new Date(row.expiresAt*1000).toLocaleString()}</span><button disabled={busy || !roster.capabilities.includes('accounts.manage')} onClick={() => void update(id,'cancel_invite')}>Cancel invitation</button></div>)}</>}
  </section>;
}
