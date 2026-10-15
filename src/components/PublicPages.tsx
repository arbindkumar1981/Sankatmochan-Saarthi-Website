import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useWebsite } from '../context/WebsiteContext';

export function PublicHome() {
  const { config } = useWebsite();
  const { user, openAuthModal } = useAuth();
  const { language, setActiveTab } = useCurriculum();
  const hi = language === 'hi';
  return <section className="flex-1 w-full min-w-0 space-y-5">
    <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-100 p-6 sm:p-10">
      <p className="text-sm font-bold text-orange-800">{hi ? 'कक्षा IX–XII के लिए' : 'For Classes IX–XII'}</p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold text-stone-900">{config.name}</h1>
      <p className="mt-4 max-w-2xl text-stone-700">{hi ? 'सीखें, अभ्यास करें, टेस्ट दें और अपनी प्रगति समझें।' : 'Learn, practise, take tests and understand your progress.'}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => user ? setActiveTab('learning') : openAuthModal('student')} className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white">{hi ? 'पढ़ाई शुरू करें' : 'Start learning'}</button>
        <button type="button" onClick={() => setActiveTab('courses')} className="rounded-xl border border-orange-300 bg-white px-5 py-3 font-semibold text-orange-900">{hi ? 'कोर्स देखें' : 'Explore courses'}</button>
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {[[hi ? 'पाठ्यक्रम' : 'Curriculum', hi ? 'बोर्ड, कक्षा और विषय चुनें।' : 'Choose your board, class and subject.'],[hi ? 'अध्ययन' : 'Learn', hi ? 'सरल नोट्स, माइंड मैप और फ्लैशकार्ड।' : 'Notes, mind maps and flashcards.'],[hi ? 'मूल्यांकन' : 'Evaluate', hi ? 'अभ्यास, टेस्ट और गलतियों का विश्लेषण।' : 'Practice, tests and mistake analysis.']].map(([title,body])=><article key={title} className="rounded-2xl border border-orange-100 bg-white p-5"><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-stone-600">{body}</p></article>)}
    </div>
  </section>;
}

export function PublicCourses() {
  const { language, setActiveTab, allCurriculumSubjects } = useCurriculum();
  const { user, openAuthModal } = useAuth();
  const hi = language === 'hi';
  const subjects = allCurriculumSubjects.filter(s => !s.deleted);
  const classes = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];
  return <section className="flex-1 w-full min-w-0 rounded-2xl border border-orange-200 bg-white p-5 sm:p-7">
    <h1 className="text-2xl font-extrabold">{hi ? 'हमारे कोर्स' : 'Our Courses'}</h1>
    <p className="mt-2 text-sm text-stone-600">{hi ? 'कक्षा 9 से 12 के लिए पाठ्यक्रम देखें।' : 'Explore the curriculum for Classes IX–XII.'}</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {classes.map(grade => <article key={grade} className="rounded-xl border border-orange-200 bg-amber-50/40 p-4">
        <h2 className="text-lg font-bold">{grade}</h2>
        <p className="mt-2 text-sm text-stone-600">{subjects.filter(s => s.classGrade === grade).length} {hi ? 'विषय' : 'subjects'}</p>
        <button type="button" className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white" onClick={() => user ? setActiveTab('learning') : openAuthModal('student')}>{hi ? 'अध्ययन करें' : 'Study now'}</button>
      </article>)}
    </div>
  </section>;
}
