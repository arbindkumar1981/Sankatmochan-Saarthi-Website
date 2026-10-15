import React from 'react';
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, ClipboardCheck, GraduationCap, Layers3, PlayCircle, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useWebsite } from '../context/WebsiteContext';

const grades = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];
const romanGrades = ['IX', 'X', 'XI', 'XII'];
const features = [
  { icon: BookOpen, en: 'Concept-first notes', hi: 'आसान और विस्तृत नोट्स', enBody: 'Chapter-wise learning in simple language, with examples and revision material.', hiBody: 'सरल भाषा, उदाहरण और रिवीजन के साथ अध्यायवार पढ़ाई।' },
  { icon: ClipboardCheck, en: 'Practice & tests', hi: 'अभ्यास और टेस्ट', enBody: 'Check understanding with questions, tests and immediate feedback.', hiBody: 'प्रश्न, टेस्ट और फीडबैक से अपनी तैयारी जाँचें।' },
  { icon: BrainCircuit, en: 'Mistake-based learning', hi: 'गलतियों से सीखें', enBody: 'Review errors and focus on concepts that need more work.', hiBody: 'गलतियाँ पहचानें और कमजोर टॉपिक पर दोबारा काम करें।' },
  { icon: TrendingUp, en: 'Learning progress', hi: 'प्रगति देखें', enBody: 'Keep your learning, saved materials and evaluations together.', hiBody: 'नोट्स, सेव की गई सामग्री और मूल्यांकन एक जगह देखें।' }
];

export function PublicHome() {
  const { config } = useWebsite();
  const { user, openAuthModal } = useAuth();
  const { language, setActiveTab } = useCurriculum();
  const hi = language === 'hi';
  const begin = () => user ? setActiveTab('learning') : openAuthModal('student');
  return <section className="flex-1 w-full min-w-0 space-y-8 pb-8">
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#102b62] via-[#16439a] to-[#2467c3] text-white shadow-xl">
      <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[50px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-36 right-1/4 h-80 w-80 rounded-full bg-sky-300/10 blur-2xl" />
      <div className="relative grid gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/30 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-sky-100"><Sparkles className="h-4 w-4" /> {hi ? 'कक्षा 9–12 • CBSE/NCERT आधारित अध्ययन' : 'CLASSES IX–XII • CURRICULUM-ALIGNED LEARNING'}</span>
          <h1 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{hi ? 'हर विद्यार्थी के लिए समझकर पढ़ने का बेहतर तरीका' : 'Learn with clarity. Practise with confidence.'}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-blue-100">{hi ? 'विस्तृत नोट्स, वीडियो, अभ्यास, टेस्ट और अपनी गलतियों की समीक्षा — आपकी पढ़ाई एक ही जगह।' : 'Detailed notes, curated videos, practice, tests and mistake review — a connected learning journey in one place.'}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={begin} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 shadow-md transition hover:bg-amber-300">{hi ? 'अभी पढ़ना शुरू करें' : 'Start Learning'} <ArrowRight className="h-4 w-4" /></button>
            <button type="button" onClick={() => setActiveTab('courses')} className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20">{hi ? 'सभी कोर्स देखें' : 'Explore Courses'}</button>
          </div>
        </div>
        <div className="rounded-3xl border border-white/20 bg-white/95 p-5 text-slate-900 shadow-2xl sm:p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="rounded-xl bg-blue-100 p-3 text-blue-700"><GraduationCap className="h-7 w-7" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{hi ? 'आपका अध्ययन केंद्र' : 'YOUR LEARNING HUB'}</p><h2 className="text-xl font-extrabold">{hi ? 'आज क्या पढ़ना है?' : 'Your next learning step'}</h2></div></div>
          <div className="mt-5 space-y-3">
            {[[BookOpen, hi ? 'अध्याय और नोट्स' : 'Explore chapters & notes'], [PlayCircle, hi ? 'वीडियो से समझें' : 'Learn with videos'], [Target, hi ? 'अभ्यास और टेस्ट' : 'Practise & test yourself']].map(([Icon, label], i) => { const IconComponent = Icon as typeof BookOpen; return <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"><span className="rounded-lg bg-blue-100 p-2 text-blue-700"><IconComponent className="h-4 w-4" /></span><span className="text-sm font-semibold">{label as string}</span><CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" /></div>; })}
          </div>
          <button type="button" onClick={begin} className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800">{hi ? 'लर्निंग डैशबोर्ड खोलें' : 'Open Learning Dashboard'}</button>
        </div>
      </div>
    </div>
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-widest text-blue-700">{hi ? 'अपनी कक्षा चुनें' : 'FIND YOUR CLASS'}</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">{hi ? 'कक्षा 9 से 12 तक की पढ़ाई' : 'Explore learning by class'}</h2></div><button type="button" onClick={() => setActiveTab('courses')} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">{hi ? 'सभी कोर्स' : 'All courses'} <ArrowRight className="h-4 w-4" /></button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{grades.map((grade, i) => <button type="button" key={grade} onClick={() => setActiveTab('courses')} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"><div className="mb-4 flex items-center justify-between"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><Layers3 className="h-6 w-6" /></span><ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" /></div><h3 className="text-xl font-extrabold text-slate-900">{hi ? 'कक्षा' : 'Class'} {romanGrades[i]}</h3><p className="mt-2 text-sm text-slate-600">{hi ? 'विषय • अध्याय • अभ्यास' : 'Subjects • Chapters • Practice'}</p></button>)}</div>
    </div>
    <div className="rounded-3xl bg-[#f1f6ff] px-5 py-8 sm:px-8"><p className="text-xs font-extrabold uppercase tracking-widest text-blue-700">{hi ? 'सार्थी के साथ सीखें' : 'WHY SAARTHI'}</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">{hi ? 'पढ़ाई का पूरा सफर, एक प्लेटफॉर्म पर' : 'One place for your learning journey'}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{features.map(({icon: Icon,en,hi: hindi,enBody,hiBody}) => <article key={en} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><span className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-700"><Icon className="h-6 w-6" /></span><h3 className="mt-4 font-extrabold text-slate-900">{hi ? hindi : en}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{hi ? hiBody : enBody}</p></article>)}</div></div>
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:p-8"><div><h2 className="text-xl font-extrabold">{hi ? 'अपनी तैयारी को सही दिशा दें' : 'Ready to take the next step?'}</h2><p className="mt-1 text-sm text-slate-300">{hi ? 'अपनी कक्षा और विषय चुनकर पढ़ाई शुरू करें।' : 'Choose your class and subject to start learning.'}</p></div><button type="button" onClick={begin} className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-900 hover:bg-amber-300">{hi ? 'पढ़ाई शुरू करें' : 'Start learning'}</button></div>
  </section>;
}

export function PublicCourses() {
  const { language, setActiveTab, allCurriculumSubjects } = useCurriculum();
  const { user, openAuthModal } = useAuth();
  const hi = language === 'hi';
  const subjects = allCurriculumSubjects.filter(s => !s.deleted);
  const [selectedClass, setSelectedClass] = React.useState<number | null>(null);
  const classDescriptions = [
    { en: 'Build strong foundations with clear concepts, step-by-step notes and regular practice.', hi: 'आसान भाषा में मजबूत नींव, चरणबद्ध नोट्स और नियमित अभ्यास।' },
    { en: 'Prepare for board examinations with NCERT-based explanations, revision and topic tests.', hi: 'NCERT आधारित समझ, रिवीजन और टॉपिक टेस्ट से बोर्ड की तैयारी।' },
    { en: 'Understand stream subjects deeply and prepare for higher-level study with guided practice.', hi: 'अपने स्ट्रीम के विषयों को गहराई से समझें और मार्गदर्शित अभ्यास करें।' },
    { en: 'Strengthen board preparation and build confidence for the next academic step.', hi: 'बोर्ड की तैयारी मजबूत करें और आगे की पढ़ाई के लिए आत्मविश्वास बढ़ाएँ।' }
  ];
  return <section className="flex-1 w-full min-w-0 space-y-6">
    <div className="rounded-3xl bg-gradient-to-r from-[#102b62] to-[#2467c3] px-6 py-9 text-white sm:px-9"><p className="text-xs font-bold uppercase tracking-widest text-blue-200">{hi ? 'पाठ्यक्रम' : 'OUR COURSES'}</p><h1 className="mt-2 text-3xl font-extrabold">{hi ? 'अपनी कक्षा चुनें, सीखना शुरू करें' : 'Find the right learning path'}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">{hi ? 'कक्षा 9–12 के विषय, अध्याय, नोट्स और अभ्यास एक जगह।' : 'Explore subjects, chapters, notes and practice for Classes IX–XII.'}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{grades.map((grade, index) => <button type="button" key={grade} aria-expanded={selectedClass === index} onClick={() => setSelectedClass(index)} className={`rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${selectedClass === index ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}><span className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-700"><GraduationCap className="h-7 w-7" /></span><h2 className="mt-4 text-2xl font-extrabold text-slate-900">{hi ? 'कक्षा' : 'Class'} {romanGrades[index]}</h2><p className="mt-2 text-sm text-slate-600">{subjects.filter(s => s.classes?.includes(grade as never)).length} {hi ? 'उपलब्ध विषय' : 'available subjects'}</p><span className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white">{hi ? 'कक्षा के बारे में देखें' : 'Explore this class'} <ArrowRight className="h-4 w-4" /></span></button>)}</div>
    {selectedClass !== null && <section aria-live="polite" className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-lg">
      <div className="grid lg:grid-cols-2">
        <div className="bg-gradient-to-br from-[#102b62] via-[#16439a] to-[#287ac9] p-5 sm:p-8">
          <svg role="img" aria-label={hi ? 'सार्थी के अध्ययन उद्देश्य का चित्र' : 'Saarthi learning mission illustration'} viewBox="0 0 640 380" className="h-auto w-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="518" cy="66" r="80" fill="#ffffff" opacity=".07"/><circle cx="105" cy="320" r="115" fill="#ffffff" opacity=".07"/>
            <rect x="45" y="55" width="550" height="270" rx="24" fill="#ffffff" opacity=".12"/>
            <rect x="85" y="92" width="280" height="193" rx="15" fill="#ffffff"/>
            <rect x="105" y="112" width="240" height="35" rx="8" fill="#dbeafe"/>
            <text x="225" y="136" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1d4ed8">SAARTHI</text>
            <path d="M110 174 Q168 146 225 174 Q282 146 340 174 L340 253 Q282 230 225 258 Q168 230 110 253Z" fill="#93c5fd"/>
            <path d="M225 174 V258" stroke="#1e40af" strokeWidth="5"/>
            <path d="M128 194 L204 194 M128 213 L204 213 M247 194 L321 194 M247 213 L321 213" stroke="#ffffff" strokeWidth="6" strokeLinecap="round"/>
            <circle cx="463" cy="172" r="78" fill="#fbbf24"/>
            <text x="463" y="157" textAnchor="middle" fontSize="18" fontWeight="800" fill="#172554">CLASS</text>
            <text x="463" y="203" textAnchor="middle" fontSize="49" fontWeight="900" fill="#172554">{romanGrades[selectedClass]}</text>
            <rect x="388" y="267" width="156" height="36" rx="18" fill="#ffffff"/>
            <text x="466" y="290" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e40af">LEARN • GROW</text>
          </svg>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <p className="text-xs font-extrabold uppercase tracking-widest text-blue-700">{hi ? 'हमारी वेबसाइट और उद्देश्य' : 'OUR WEBSITE & MISSION'}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">{hi ? 'कक्षा' : 'Class'} {romanGrades[selectedClass]} — Sankatmochan Saarthi</h2>
          <p className="mt-4 text-base leading-7 text-slate-700">{hi ? classDescriptions[selectedClass].hi : classDescriptions[selectedClass].en}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{hi ? 'हमारा उद्देश्य है कि हर विद्यार्थी सरल नोट्स, वीडियो, अभ्यास, टेस्ट, गलतियों की समीक्षा और अपनी प्रगति देखकर आत्मविश्वास के साथ आगे बढ़े।' : 'Our mission is to help every student learn confidently through simple notes, videos, practice, tests, mistake review and clear progress tracking.'}</p>
          <div className="mt-5 flex flex-wrap gap-2">{(hi ? ['समझें', 'अभ्यास', 'टेस्ट', 'प्रगति'] : ['Understand', 'Practise', 'Test', 'Progress']).map(item => <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">{item}</span>)}</div>
          <button type="button" onClick={() => user ? setActiveTab('learning') : openAuthModal('student')} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">{hi ? 'पढ़ाई शुरू करें' : 'Start learning'} <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>}
  </section>;
}
