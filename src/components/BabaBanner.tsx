import React, { useState, useEffect } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Sparkles, RotateCw, Quote } from 'lucide-react';

const BABA_QUOTES = [
  {
    hi: 'सबको प्यार करो, सबकी सेवा करो, भगवान को याद रखो और सदा सत्य बोलो।',
    en: 'Love everyone, serve everyone, remember God, and tell the truth.'
  },
  {
    hi: 'सब एक है (Sub Ek Hai)। चिंता छोड़ो, परमात्मा की कृपा पर विश्वास रखो।',
    en: 'All is One (Sub Ek Hai). Release anxiety and trust divine grace.'
  },
  {
    hi: 'कवन सो काज कठिन जग माहीं। जो नहिं तात होत तुम्ह पाहीं॥',
    en: 'No task in this world is too difficult when pursued with sincere devotion.'
  },
  {
    hi: 'विद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥',
    en: 'Endowed with wisdom, character and vigilance in righteous duties.'
  },
  {
    hi: 'कर्म पूरी निष्ठा से करो, फल की चिंता परमात्मा पर छोड़ दो — विजय निश्चित है।',
    en: 'Perform your duties with dedication; leave results to the Divine.'
  },
  {
    hi: 'मन को शांत और पवित्र रखो, संकटमोचन स्वयं हर राह में सहायता करेंगे।',
    en: 'Keep your heart pure and mind calm; divine grace guides every step.'
  }
];

export const BabaBanner: React.FC = () => {
  const { language } = useCurriculum();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Auto-rotate quote every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % BABA_QUOTES.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleNextQuote = () => {
    setIsRotating(true);
    setQuoteIndex((prev) => (prev + 1) % BABA_QUOTES.length);
    setTimeout(() => setIsRotating(false), 400);
  };

  const currentQuote = language === 'hi' ? BABA_QUOTES[quoteIndex].hi : BABA_QUOTES[quoteIndex].en;

  return (
    <div className="relative bg-gradient-to-r from-amber-700 via-orange-600 to-red-700 text-white shadow-sm border-b border-amber-400/50">
      {/* Sacred Subtle Texture Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#fed7aa_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 relative z-10">
        {/* Single-line unified display: Baba Ji Quotes placed directly here without image */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Sacred ॐ Badge */}
          <div className="flex items-center gap-1.5 shrink-0 bg-black/30 border border-amber-300/40 px-2.5 py-1 rounded-lg text-amber-200 shadow-xs">
            <span className="text-amber-300 font-black text-sm">ॐ</span>
            <span className="text-xs sm:text-sm font-extrabold tracking-wide text-amber-100 font-cinzel whitespace-nowrap">
              {language === 'hi' ? 'नीम करौली बाबा जी विचार :' : 'Baba Neem Karoli Ji Quotes :'}
            </span>
          </div>

          {/* Baba Ji Sacred Quote placed directly here */}
          <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-hidden">
            <Quote className="w-3.5 h-3.5 text-amber-300 shrink-0 fill-amber-300/20 hidden sm:inline" />
            <p className="text-xs sm:text-sm font-semibold text-amber-50 font-serif italic truncate">
              "{currentQuote}"
            </p>
          </div>

          {/* Quick Next Quote Trigger */}
          <button
            onClick={handleNextQuote}
            className="px-2 py-0.5 rounded-md bg-black/20 hover:bg-black/40 text-amber-200 hover:text-white border border-amber-300/30 text-xs flex items-center gap-1 transition-colors shrink-0"
            title="अगला विचार (Next Quote)"
          >
            <RotateCw
              className={`w-3 h-3 text-amber-300 transition-transform ${
                isRotating ? 'rotate-180' : ''
              }`}
            />
            <span className="hidden md:inline font-sans">
              {language === 'hi' ? 'अन्य विचार' : 'Next'}
            </span>
          </button>
        </div>

        {/* Auspicious Devotional Subtitle */}
        <div className="hidden lg:flex items-center gap-1.5 text-amber-200/90 text-xs font-serif italic shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>सब दुख दूर करें संकटमोचन हनुमान जी</span>
        </div>
      </div>
    </div>
  );
};
