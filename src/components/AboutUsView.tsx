import { useWebsite } from '../context/WebsiteContext';
import { WebsiteText } from '../context/WebsiteContext';
import React from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { SankatmochanLogo } from './SankatmochanLogo';
import { Sparkles, Shield, Heart, BookOpen, Compass, Award } from 'lucide-react';

export const AboutUsView: React.FC = () => {
  const { text: websiteText } = useWebsite();
  const { language, babaImageUrl } = useCurriculum();

  return (
    <div className="flex-1 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-4 sm:p-6 flex flex-col gap-6 min-w-0">
      {/* Header */}
      <div className="border-b border-orange-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-cinzel flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-600" />
            <span>{language === 'hi' ? websiteText("हमारे विषय में (About Us)") : websiteText("About Saarthi by Sankatmochan")}</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {language === 'hi'
              ? websiteText("आध्यात्मिक प्रेरणा, शैक्षणिक उत्कृष्टता एवं निष्काम विद्यादान संकल्प")
              : websiteText("Spiritual grounding, academic brilliance, and selfless guidance for Classes IX–XII")}
          </p>
        </div>

        {/* Official Brand Logo */}
        <div className="bg-amber-50/70 border border-orange-200 p-2 rounded-2xl shadow-xs self-start md:self-auto flex items-center justify-center">
          <SankatmochanLogo className="w-52 max-w-full" />
        </div>
      </div>

      {/* Hero Spiritual Sanctuary */}
      <div className="bg-gradient-to-br from-amber-700 via-orange-600 to-red-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-tr from-yellow-300 via-amber-200 to-yellow-500 shadow-2xl overflow-hidden shrink-0 border-4 border-white/60">
          {babaImageUrl && <img
            src={babaImageUrl}
            alt={websiteText("Revered Baba Neem Karoli Ji Maharaj (मूल पावन स्वरूप)")}
            className="w-full h-full object-cover object-top rounded-full bg-amber-900"
          />}
        </div>

        <div className="text-center md:text-left space-y-2">
          <div className="text-xs font-bold text-amber-200 uppercase tracking-widest font-cinzel"><WebsiteText original={"Divine Inspiration & Foundation"} /></div>
          <h3 className="text-xl sm:text-2xl font-black font-cinzel leading-tight text-amber-50"><WebsiteText original={"Revered Baba Neem Karoli Ji & Sankatmochan Hanuman Ji"} /></h3>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-serif italic"><WebsiteText original={"\"विद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥\" Education at Saarthi is not merely about clearing examinations; it is about building unwavering moral character, clarity of intellect, and selfless dedication."} /></p>
        </div>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50/60 border border-orange-200 p-4 rounded-2xl">
          <BookOpen className="w-7 h-7 text-orange-600 mb-2" />
          <h4 className="font-bold text-sm text-stone-900 font-cinzel"><WebsiteText original={"Rigorous NCERT & Board Alignment"} /></h4>
          <p className="text-xs text-stone-600 leading-relaxed mt-1"><WebsiteText original={"Complete syllabus coverage for Classes IX–XII across CBSE, ICSE, UP, and State Boards with authentic course codes."} /></p>
        </div>

        <div className="bg-red-50/60 border border-red-200 p-4 rounded-2xl">
          <Shield className="w-7 h-7 text-red-600 mb-2" />
          <h4 className="font-bold text-sm text-stone-900 font-cinzel"><WebsiteText original={"50% Competency & Case Mastery"} /></h4>
          <p className="text-xs text-stone-600 leading-relaxed mt-1"><WebsiteText original={"Custom analytical tests, real-world case studies, and instant scoring so students master the new exam patterns."} /></p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl">
          <Award className="w-7 h-7 text-emerald-600 mb-2" />
          <h4 className="font-bold text-sm text-stone-900 font-cinzel"><WebsiteText original={"The Personal Mistake Book"} /></h4>
          <p className="text-xs text-stone-600 leading-relaxed mt-1"><WebsiteText original={"An automated remediation engine converting every incorrect test answer into a lasting strength through targeted re-tests."} /></p>
        </div>
      </div>

      {/* Principal's Message */}
      <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl">
        <h4 className="font-bold text-xs uppercase tracking-wider text-orange-950 font-cinzel mb-1"><WebsiteText original={"Leadership & Academic Vision"} /></h4>
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic font-serif"><WebsiteText original={"\"At Saarthi by Sankatmochan, we welcome every student with patience and devotion. Whether preparing for Class X board examinations or Class XII competitive milestones, our curated video lectures, instant objective assessments, and spiritual calmness empower students to achieve the highest honors.\""} /></p>
        <span className="block mt-2 text-xs font-bold text-stone-800"><WebsiteText original={"— Principal A. Kumar, Academic Director"} /></span>
      </div>
    </div>
  );
};
