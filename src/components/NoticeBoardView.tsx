import React from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import {
  BellRing,
  Flame,
  Award,
  AlertCircle,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  HeartHandshake
} from 'lucide-react';

export const NoticeBoardView: React.FC = () => {
  const { notices, testResults, language, babaImageUrl } = useCurriculum();
  const { profile } = useAuth();

  // Compute student strengths and weaknesses from testResults
  const allStrengths = new Set<string>();
  const allWeaknesses = new Set<string>();

  testResults.forEach((tr) => {
    tr.strengths.forEach((s) => allStrengths.add(s));
    tr.weaknesses.forEach((w) => allWeaknesses.add(w));
  });

  const strengthsList = Array.from(allStrengths);
  const weaknessesList = Array.from(allWeaknesses);

  return (
    <div className="flex-1 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-4 sm:p-6 flex flex-col gap-6 min-w-0">
      {/* Notice Board Header */}
      <div className="border-b border-orange-100 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-cinzel flex items-center gap-2">
            <BellRing className="w-6 h-6 text-orange-600" />
            <span>{language === 'hi' ? 'प्रेरणादायक सूचना पट्ट' : 'Personalized Motivational Notice Board'}</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {language === 'hi'
              ? 'विद्यार्थी शक्तियाँ, सुधार क्षेत्र, दैनिक पावन विचार एवं बोर्ड घोषणाएँ'
              : 'Real-time student strengths, growth focus areas, divine wisdom & academic circulars'}
          </p>
        </div>

        {/* Study Streak Chip */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-orange-300 px-3.5 py-1.5 rounded-xl shadow-xs">
          <Flame className="w-5 h-5 text-orange-600 animate-bounce" />
          <div className="text-xs leading-tight">
            <span className="font-extrabold text-orange-950 block">
              {profile?.studyStreakDays || 1} Days Active Streak
            </span>
            <span className="text-[10px] text-orange-800 font-medium">Keep learning daily</span>
          </div>
        </div>
      </div>

      {/* Top Banner: Divine Wisdom & Blessing of Baba Neem Karoli Ji */}
      <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-300 via-amber-200 to-yellow-500 shadow-xl overflow-hidden shrink-0 border-2 border-white">
            <img
              src={babaImageUrl}
              alt="Revered Baba Neem Karoli Ji Maharaj (मूल पावन स्वरूप)"
              className="w-full h-full object-cover object-top rounded-full bg-amber-900"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-200 font-cinzel font-bold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>जय श्री नीम करौली बाबा जी महाराज • संकटमोचन कृपा</span>
            </div>
            <h3 className="text-base sm:text-xl font-bold font-serif italic mt-1 leading-snug">
              "Love Everyone, Serve Everyone, Remember God, Tell the Truth."
            </h3>
            <p className="text-xs text-amber-100 mt-1 font-serif">
              "सब सुख लहै तुम्हारी सरना, तुम रक्षक काहू को डरना।" When sincerity guides your study hours, wisdom blossoms effortlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Personalized Motivational Assessment Grid (Strengths vs Improvement Areas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Your Strengths Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base font-cinzel">
                {language === 'hi' ? 'आपकी प्रमाणित शक्तियाँ (Strengths)' : 'Demonstrated Strengths'}
              </h3>
              <p className="text-[11px] text-emerald-800">
                Concepts where you have consistently scored 80%+ accuracy
              </p>
            </div>
          </div>

          {strengthsList.length > 0 ? (
            <div className="space-y-2">
              {strengthsList.map((str, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-stone-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="capitalize">{str}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 p-4 rounded-xl border border-emerald-200 text-xs text-stone-600 leading-relaxed">
              <p className="font-semibold text-stone-800 mb-1">
                Take a test in the Learning Hub to identify your strengths!
              </p>
              <span>Our Saarthi engine will automatically analyze your accuracy and pin your top competencies right here.</span>
            </div>
          )}
        </div>

        {/* Growth Focus / Improvement Areas Card */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base font-cinzel">
                {language === 'hi' ? 'सुधार के प्राथमिक क्षेत्र (Focus Areas)' : 'Targeted Growth Areas'}
              </h3>
              <p className="text-[11px] text-orange-800">
                Topics automatically linked with your personal Mistake Book
              </p>
            </div>
          </div>

          {weaknessesList.length > 0 ? (
            <div className="space-y-2">
              {weaknessesList.map((wk, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-orange-200 flex items-center gap-2 text-xs font-semibold text-stone-800"
                >
                  <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="capitalize">{wk}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 p-4 rounded-xl border border-orange-200 text-xs text-stone-600 leading-relaxed">
              <p className="font-semibold text-stone-800 mb-1">
                Zero critical weaknesses registered!
              </p>
              <span>Keep attempting Topic & Chapter tests. Any question missed will automatically queue here with curated revision tips.</span>
            </div>
          )}
        </div>
      </div>

      {/* Official Circulars & Motivational Announcements List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-stone-900 font-cinzel">
          {language === 'hi' ? 'नवीनतम सूचनाएं एवं परिपत्र' : 'Official Announcements & Circulars'}
        </h3>

        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className="bg-white border border-stone-200 hover:border-orange-300 rounded-2xl p-4 shadow-xs transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      n.category === 'urgent'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {n.category}
                  </span>
                  <h4 className="font-bold text-sm text-stone-900">
                    {language === 'hi' && n.hindiTitle ? n.hindiTitle : n.title}
                  </h4>
                </div>

                <span className="text-[11px] text-stone-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" />
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed pl-1">
                {language === 'hi' && n.hindiMessage ? n.hindiMessage : n.message}
              </p>

              {n.blessingQuote && (
                <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 italic font-serif">
                  "{n.blessingQuote}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
