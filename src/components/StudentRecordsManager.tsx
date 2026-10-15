import React, { useMemo, useState } from 'react';
import type { UserProfile } from '../types';

interface StudentResult {
  id?: string;
  studentUid?: string;
  title?: string;
  testTitle?: string;
  createdAt?: string;
  percentage?: number;
  score?: number;
  totalMarks?: number;
  subjectId?: string;
  testType?: string;
}

interface StudentMistake { id: string; studentUid?: string; questionText?: string; question?: string; topicTitle?: string; concept?: string; createdAt?: string; reason?: string; }

interface Props {
  students: UserProfile[];
  results: StudentResult[];
  mistakes: StudentMistake[];
}

/** Read-only directory. Academic records are never mutated from this view. */
export function StudentRecordsManager({ students, results, mistakes }: Props) {
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('all');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const grades = useMemo(() => [...new Set(students.map(s => s.classGrade).filter(Boolean))].sort(), [students]);
  const matching = useMemo(() => students.filter(student => {
    const name = `${student.displayName || ''} ${student.email || ''} ${student.uid}`.toLowerCase();
    return name.includes(query.trim().toLowerCase()) && (grade === 'all' || student.classGrade === grade);
  }), [students, query, grade]);
  const attemptsByStudent = useMemo(() => {
    const grouped = new Map<string, StudentResult[]>();
    for (const attempt of results) {
      if (!attempt.studentUid) continue;
      const previous = grouped.get(attempt.studentUid) || [];
      previous.push(attempt);
      grouped.set(attempt.studentUid, previous);
    }
    for (const attempts of grouped.values()) attempts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return grouped;
  }, [results]);
  const selected = students.find(s => s.uid === selectedUid);
  const selectedAttempts = selected ? attemptsByStudent.get(selected.uid) || [] : [];
  const subjectProgress = selected ? [...selectedAttempts.reduce((groups, attempt) => {
    const key = attempt.subjectId || 'Unassigned subject';
    const current = groups.get(key) || { subject: key, attempts: 0, totalScore: 0, scored: 0 };
    current.attempts += 1;
    if (typeof attempt.percentage === 'number' && Number.isFinite(attempt.percentage)) {
      current.totalScore += attempt.percentage;
      current.scored += 1;
    }
    groups.set(key, current);
    return groups;
  }, new Map<string, { subject: string; attempts: number; totalScore: number; scored: number }>()).values()] : [];
  const selectedMistakes = selected ? mistakes.filter(item => item.studentUid === selected.uid).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')) : [];
  const completed = results.filter(item => typeof item.percentage === 'number' && Number.isFinite(item.percentage));
  const meanScore = completed.length ? Math.round(completed.reduce((total, item) => total + (item.percentage || 0), 0) / completed.length) : null;
  const activeStudentCount = new Set(results.map(item => item.studentUid).filter(Boolean)).size;
  const percent = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}%` : '—';

  return <section className="space-y-4" aria-label="Student records manager">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-base font-bold text-stone-900">Student Records</h3>
        <p className="text-xs text-stone-600">Search registered students and review their saved assessment history. Student identity and marks are read-only here.</p>
      </div>
      <span className="rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold">{matching.length} of {students.length} students</span>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Student progress overview">
      {[
        ['Registered students', String(students.length)],
        ['Students with tests', String(activeStudentCount)],
        ['Recorded attempts', String(results.length)],
        ['Average test score', meanScore === null ? '—' : `${meanScore}%`]
      ].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-3"><p className="text-xs text-stone-600">{label}</p><p className="text-xl font-bold text-stone-900">{value}</p></div>)}
    </div>
    <p className="text-xs text-stone-500">These metrics use recorded tests, not topic mastery. Students without tests are excluded from average score.</p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label className="sm:col-span-2 text-xs font-semibold">Find student
        <input aria-label="Search students" className="mt-1 w-full rounded-lg border bg-white p-2 text-sm" placeholder="Name, email or student ID" value={query} onChange={e => setQuery(e.target.value)} />
      </label>
      <label className="text-xs font-semibold">Class
        <select aria-label="Filter student class" className="mt-1 w-full rounded-lg border bg-white p-2 text-sm" value={grade} onChange={e => setGrade(e.target.value)}>
          <option value="all">All classes</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
    </div>
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-700"><tr><th className="p-3">Student</th><th className="p-3">Class / Board</th><th className="p-3">Attempts</th><th className="p-3">Latest score</th><th className="p-3">Details</th></tr></thead>
        <tbody className="divide-y">
          {matching.map(student => {
            const attempts = attemptsByStudent.get(student.uid) || [];
            return <tr key={student.uid}>
              <td className="p-3"><span className="block font-semibold">{student.displayName || 'Student'}</span><span className="block text-xs text-stone-500">{student.email || student.uid}</span></td>
              <td className="p-3">{student.classGrade || '—'} · {student.board || '—'}</td>
              <td className="p-3">{attempts.length}</td>
              <td className="p-3">{attempts.length ? percent(attempts[0].percentage) : '—'}</td>
              <td className="p-3"><button type="button" className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-orange-50" aria-label={`View records for ${student.displayName || student.uid}`} onClick={() => setSelectedUid(student.uid === selectedUid ? null : student.uid)}>{selectedUid === student.uid ? 'Close' : 'View records'}</button></td>
            </tr>;
          })}
          {!matching.length && <tr><td colSpan={5} className="p-6 text-center text-stone-500">No matching students.</td></tr>}
        </tbody>
      </table>
    </div>
    {selected && <div className="rounded-xl border bg-stone-50 p-4 space-y-3" aria-label="Selected student assessment history">
      <div className="flex items-center justify-between gap-2"><div><h4 className="font-bold">{selected.displayName || 'Student'} — Assessment history</h4><p className="text-xs text-stone-600">Student ID: {selected.uid}</p></div><button type="button" className="rounded-lg border px-3 py-1.5 text-xs" onClick={() => setSelectedUid(null)}>Close</button></div>
      {selectedAttempts.length ? <div className="max-h-80 overflow-y-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Test</th><th className="p-2">Date</th><th className="p-2">Score</th></tr></thead><tbody>{selectedAttempts.map((attempt, index) => <tr className="border-t" key={attempt.id || index}><td className="p-2">{attempt.testTitle || attempt.title || 'Assessment'}</td><td className="p-2">{attempt.createdAt ? attempt.createdAt.slice(0, 10) : '—'}</td><td className="p-2">{percent(attempt.percentage)}</td></tr>)}</tbody></table></div> : <p className="text-xs text-stone-600">No recorded test attempts.</p>}
      <div className="space-y-2">
        <h5 className="text-sm font-bold">Subject-wise assessment progress</h5>
        <p className="text-xs text-stone-600">Mean recorded test score by subject; not a topic mastery estimate.</p>
        {subjectProgress.length ? <table className="w-full text-left text-xs"><thead><tr><th className="p-2">Subject ID</th><th className="p-2">Attempts</th><th className="p-2">Mean score</th></tr></thead><tbody>{subjectProgress.map(row => <tr key={row.subject} className="border-t"><td className="p-2">{row.subject}</td><td className="p-2">{row.attempts}</td><td className="p-2">{row.scored ? percent(row.totalScore / row.scored) : '—'}</td></tr>)}</tbody></table> : <p className="text-xs text-stone-600">No subject-tagged assessments.</p>}
      </div>
      <div className="space-y-2">
        <h5 className="text-sm font-bold">Mistake Book ({selectedMistakes.length})</h5>
        {selectedMistakes.length ? <div className="max-h-80 overflow-y-auto rounded-lg border bg-white">
          <table className="w-full text-left text-xs"><thead><tr><th className="p-2">Question / Concept</th><th className="p-2">Topic</th><th className="p-2">Reason</th></tr></thead>
            <tbody>{selectedMistakes.map(item => <tr key={item.id} className="border-t"><td className="p-2">{item.questionText || item.question || item.concept || 'Question not recorded'}</td><td className="p-2">{item.topicTitle || '—'}</td><td className="p-2">{item.reason || '—'}</td></tr>)}</tbody>
          </table>
        </div> : <p className="text-xs text-stone-600">No recorded mistakes.</p>}
      </div>
    </div>}
    <p className="text-xs text-stone-500">Data shown here is loaded from the existing user and test-result records. A backend-authoritative gradebook, consent workflow and audit history require separate implementation.</p>
  </section>;
}
