import React, { useState, useEffect } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import {
  Sparkles,
  Quote,
  RotateCw,
  Copy,
  Check
} from 'lucide-react';

interface AffirmationItem {
  id: string;
  source: string;
  quoteEn: string;
  quoteHi: string;
  tag: string;
}

const AFFIRMATIONS: AffirmationItem[] = [
  {
    id: 'affirm-1',
    source: 'बाबा नीम करौली जी महाराज',
    quoteHi: 'सबको प्यार करो, सबकी सेवा करो, भगवान को याद रखो और सदा सत्य बोलो।',
    quoteEn: 'Love everyone, serve everyone, remember God, and tell the truth.',
    tag: 'महामंत्र'
  },
  {
    id: 'affirm-2',
    source: 'संकटमोचन हनुमान जी',
    quoteHi: 'कवन सो काज कठिन जग माहीं। जो नहिं तात होत तुम्ह पाहीं॥',
    quoteEn: 'No task in this universe is impossible with sincere devotion and perseverance.',
    tag: 'आत्मबल'
  },
  {
    id: 'affirm-3',
    source: 'बाबा नीम करौली जी महाराज',
    quoteHi: 'सब एक है (Sub Ek Hai)। चिंता छोड़ो, परमात्मा की इच्छा से उत्तम ही होगा।',
    quoteEn: 'All is One (Sub Ek Hai). Release worry; trust divine grace.',
    tag: 'शांति'
  },
  {
    id: 'affirm-4',
    source: 'विद्या दान संकल्प',
    quoteHi: 'विद्या ददाति विनयं, विनयाद्याति पात्रताम्। विद्या ही सबसे बड़ा परम धन है।',
    quoteEn: 'Knowledge bestows humility and worthiness. It is your greatest inner strength.',
    tag: 'विद्या'
  },
  {
    id: 'affirm-5',
    source: 'बाबा नीम करौली जी महाराज',
    quoteHi: 'सच्ची लगन और पवित्र मन से की गई पढ़ाई में संकटमोचन स्वयं सारथी बनते हैं।',
    quoteEn: 'With pure devotion, divine grace becomes your guiding Saarthi.',
    tag: 'संकल्प'
  }
];

export const DailySpiritualAffirmation: React.FC = () => {
  const { babaImageUrl, language } = useCurriculum();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const day = new Date().getDate();
    setCurrentIndex(day % AFFIRMATIONS.length);
  }, []);

  const activeAffirmation = AFFIRMATIONS[currentIndex];

  const handleNextQuote = () => {
    setIsRotating(true);
    setCurrentIndex((prev) => (prev + 1) % AFFIRMATIONS.length);
    setTimeout(() => setIsRotating(false), 400);
  };

  const handleCopyQuote = () => {
    const textToCopy = `"${language === 'hi' ? activeAffirmation.quoteHi : activeAffirmation.quoteEn}" — ${activeAffirmation.source}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      aria-label="Daily Spiritual Affirmation"
      className="w-full bg-gradient-to-r from-amber-100/90 via-orange-100/80 to-amber-100/90 border border-orange-300 rounded-xl px-3 py-2 shadow-xs hover:shadow-sm transition-all"
    >
      {/* Single Unbroken Line Layout */}
      <div className="flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          {/* Sacred ॐ Flame Emblem */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 shadow-xs ring-1 ring-orange-400 flex items-center justify-center text-white font-black text-sm shrink-0">
            ॐ
          </div>

          {/* Badge Label */}
          <span className="text-[11px] font-extrabold uppercase text-orange-950 font-cinzel shrink-0 bg-white/80 border border-orange-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-600 animate-pulse" />
            <span>{language === 'hi' ? 'बाबा जी विचार:' : 'Baba Ji Quote:'}</span>
          </span>

          {/* Quote Text in the EXACT SAME LINE */}
          <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-hidden">
            <Quote className="w-3.5 h-3.5 text-orange-500 shrink-0 fill-orange-400/20" />
            <p className="text-xs sm:text-sm font-bold text-stone-900 font-serif italic truncate">
              {language === 'hi' ? activeAffirmation.quoteHi : activeAffirmation.quoteEn}
            </p>
          </div>
        </div>

        {/* Action Controls in the SAME line */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleNextQuote}
            className="px-2 py-1 rounded-lg bg-white/90 hover:bg-white border border-orange-200 text-stone-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
            title="Next Quote"
          >
            <RotateCw
              className={`w-3 h-3 text-orange-600 transition-transform ${
                isRotating ? 'rotate-180' : ''
              }`}
            />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'अन्य विचार' : 'Next'}
            </span>
          </button>

          <button
            onClick={handleCopyQuote}
            className="p-1 sm:px-2 sm:py-1 rounded-lg bg-white/90 hover:bg-white border border-orange-200 text-stone-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
            title="Copy Quote"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-stone-500" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
