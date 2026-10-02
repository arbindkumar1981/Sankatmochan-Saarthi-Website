import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurriculum } from '../context/CurriculumContext';
import { SUPPORTED_BOARDS } from '../data/defaultCurriculum';
import { BoardType, ClassGrade, StreamType } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Mail,
  User,
  X,
  Flame,
  CheckCircle2,
  LogIn
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalInitialTab,
    closeAuthModal,
    signInWithGoogle,
    signInAsGuestStudent
  } = useAuth();

  const { language, curriculumSubjects, setSelectedSubject: setLearningSubject, setSelectedStream: setLearningStream } = useCurriculum();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>(authModalInitialTab);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassGrade>('Class 10');
  const [selectedBoard, setSelectedBoard] = useState<BoardType>('CBSE');
  const [selectedStream, setSelectedStream] = useState<StreamType>('General');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [showAllSeniorSubjects, setShowAllSeniorSubjects] = useState(false);

  const isSeniorClass = selectedClass === 'Class 11' || selectedClass === 'Class 12';
  const seniorClassSubjects = curriculumSubjects.filter((sub) => sub.classes.includes(selectedClass));
  const loginSubjects = curriculumSubjects.filter((sub) => {
    if (!sub.classes.includes(selectedClass)) return false;
    if (isSeniorClass) return showAllSeniorSubjects || sub.stream === selectedStream || sub.stream === 'General';
    return sub.stream === 'General';
  });

  React.useEffect(() => {
    if (!loginSubjects.some(s => s.id === selectedSubjectId)) setSelectedSubjectId(loginSubjects[0]?.id || '');
  }, [selectedClass, selectedStream, showAllSeniorSubjects, curriculumSubjects]);

  const [adminError, setAdminError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync tab with initial tab prop when modal opens
  React.useEffect(() => {
    setActiveTab(authModalInitialTab);
    setAdminError('');
  }, [authModalInitialTab, authModalOpen]);

  if (!authModalOpen) return null;

  const handleGoogleStudent = async () => {
    try {
      setLoading(true);
      await signInWithGoogle('student');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdmin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle('admin');
    } catch (err) {
      console.error(err);
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code || '') : '';
      const message = err instanceof Error ? err.message : String(err);
      setAdminError(code ? `${code}: ${message}` : message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    const subject = loginSubjects.find(s => s.id === selectedSubjectId) || loginSubjects[0];
    setLearningStream(selectedStream);
    if (subject) setLearningSubject(subject);
    signInAsGuestStudent(studentName.trim(), selectedClass, selectedBoard, selectedStream);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-orange-500 overflow-hidden relative">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg">
              <Flame className="w-5 h-5 text-amber-200" />
            </span>
            <div>
              <h3 className="font-extrabold text-lg font-cinzel">
                {language === 'hi' ? 'सारथी प्रवेश द्वार' : 'Saarthi Access Gateway'}
              </h3>
              <p className="text-xs text-amber-100">
                {language === 'hi'
                  ? 'छात्र एवं प्रशासक (Admin) प्रमाणीकरण'
                  : 'Student & Administrative Authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Student Sign In vs Admin Login placed strictly TOGETHER */}
        <div className="grid grid-cols-2 bg-amber-50 p-1.5 border-b border-orange-200">
          <button
            onClick={() => {
              setActiveTab('student');
              setAdminError('');
            }}
            className={`py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'student'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-stone-600 hover:text-orange-600 hover:bg-amber-100/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{language === 'hi' ? 'छात्र साइन इन / रजिस्टर' : 'Student Sign In / Sign Up'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setAdminError('');
            }}
            className={`py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-red-600 to-orange-700 text-white shadow-md'
                : 'text-stone-600 hover:text-red-700 hover:bg-amber-100/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'hi' ? 'प्रशासक (Admin) लॉगिन' : 'Admin Portal Login'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'student' ? (
            <div className="space-y-5">
              {/* Google Sign-in */}
              <div>
                <button
                  onClick={handleGoogleStudent}
                  disabled={loading}
                  className="w-full py-3 px-4 border border-stone-300 rounded-xl font-semibold text-stone-700 bg-white hover:bg-stone-50 hover:border-orange-400 flex items-center justify-center gap-3 shadow-sm transition-all text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>
                    {language === 'hi'
                      ? 'गूगल खाते से छात्र लॉगिन करें'
                      : 'Continue with Google Account'}
                  </span>
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-3 text-xs text-stone-400 uppercase font-semibold">
                  {language === 'hi' ? 'या त्वरित छात्र प्रवेश' : 'Or Quick Student Sign In'}
                </span>
                <div className="border-t border-stone-200 w-full" />
              </div>

              {/* Quick Guest Student Form */}
              <form onSubmit={handleGuestStudentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {language === 'hi' ? 'विद्यार्थी का नाम' : 'Student Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder={language === 'hi' ? 'जैसे: अर्णव शर्मा' : 'e.g. Arbind Kumar'}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'hi' ? 'कक्षा (Class)' : 'Class'}
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value as ClassGrade)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="Class 9">Class IX (9th)</option>
                      <option value="Class 10">Class X (10th)</option>
                      <option value="Class 11">Class XI (11th)</option>
                      <option value="Class 12">Class XII (12th)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === 'hi' ? 'शिक्षा बोर्ड (Board)' : 'Board'}
                    </label>
                    <select
                      value={selectedBoard}
                      onChange={(e) => setSelectedBoard(e.target.value as BoardType)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      {SUPPORTED_BOARDS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(selectedClass === 'Class 11' || selectedClass === 'Class 12') && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">{language === 'hi' ? 'स्ट्रीम (Stream)' : 'Stream'}</label>
                    <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value as StreamType)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none">
                      <option value="Science">Science</option><option value="Commerce">Commerce</option><option value="Humanities">Humanities</option>
                    </select>
                  </div>
                )}

                {isSeniorClass && (
                  <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-stone-700">
                    <input type="checkbox" checked={showAllSeniorSubjects} onChange={(e) => setShowAllSeniorSubjects(e.target.checked)} className="accent-orange-600" />
                    <span>{language === 'hi' ? 'अन्य / वैकल्पिक विषय भी दिखाएँ' : 'Show other / optional subjects too'}</span>
                    <span className="ml-auto text-[10px] text-stone-500">{seniorClassSubjects.length} available</span>
                  </label>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">{language === 'hi' ? 'विषय चुनें (Subject)' : 'Select Subject'}</label>
                  <select required value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none">
                    {loginSubjects.length ? loginSubjects.map(sub => <option key={sub.id} value={sub.id}>{language === 'hi' ? sub.hindiName : sub.name}{sub.officialCode ? ` (${sub.officialCode})` : ''}</option>) : <option value="">No subject available</option>}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {language === 'hi' ? 'अध्ययन प्रारंभ करें' : 'Start Learning with Saarthi'}
                  </span>
                </button>
              </form>

              <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'hi'
                    ? 'छात्रों के टेस्ट अंक, मिस्टेक बुक और प्रगति रिपोर्ट निजी व सुरक्षित रहते हैं।'
                    : 'All test scores, Mistake Book records, and personal progress remain private to you.'}
                </span>
              </div>
            </div>
          ) : (
            /* Admin Tab */
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-3">
                <Lock className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-xs text-red-900 leading-relaxed">
                  {language === 'hi'
                    ? 'प्रशासकीय नियंत्रण कक्ष: पाठ्यक्रम, सामग्री अनुमोदन, टेस्ट, वीडियो, नोटिस एवं छात्र प्रबंधन।'
                    : 'Administrative Control: Full authorization to manage curriculum, publish notes, tests, videos, circulars, and student records.'}
                </p>
              </div>

              {/* Admin Google Sign-in */}
              <button
                onClick={handleGoogleAdmin}
                disabled={loading}
                className="w-full py-2.5 px-4 border border-stone-300 rounded-xl font-semibold text-stone-700 bg-white hover:bg-stone-50 hover:border-red-500 flex items-center justify-center gap-3 shadow-sm transition-all text-sm"
              >
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <span>Sign In as Admin via Google (principal.a.kumar@gmail.com)</span>
              </button>

              {adminError && (
                <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg break-words">
                  <strong>Google sign-in failed:</strong> {adminError}
                </div>
              )}



                          </div>
          )}
        </div>
      </div>
    </div>
  );
};
