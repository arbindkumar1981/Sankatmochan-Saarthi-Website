import { WebsiteText } from '../context/WebsiteContext';
import { useWebsite } from '../context/WebsiteContext';
import React, { useState, useEffect } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { Sparkles, RotateCw, Quote } from 'lucide-react';

const BABA_PUBLIC_DOMAIN_FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/6/66/Neemkaroli_14.jpg';

export const BabaBanner: React.FC = () => {
  const { text: websiteText } = useWebsite();
  const { language, babaImageUrl } = useCurriculum();
  const { config } = useWebsite();
  const quotes = config.quotes.filter(x => !x.deleted);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Auto-rotate quote every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % Math.max(quotes.length, 1));
    }, 12000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  const handleNextQuote = () => {
    setIsRotating(true);
    setQuoteIndex((prev) => (prev + 1) % Math.max(quotes.length, 1));
    setTimeout(() => setIsRotating(false), 400);
  };

  const quote = quotes[quoteIndex % Math.max(quotes.length, 1)];
  const currentQuote = quote ? (language === 'hi' ? quote.hi || quote.en : quote.en) : '';
  if (!config.bannerVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-700 via-orange-600 to-red-700 text-white shadow-sm border-b border-amber-400/50">
      {/* Sacred Subtle Texture Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#fed7aa_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 relative z-10">
        {/* Single-line unified display: Baba Ji Quotes placed directly here without image */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Sacred ॐ Badge */}
          <div className="flex items-center gap-1.5 shrink-0 bg-black/30 border border-amber-300/40 px-2.5 py-1 rounded-lg text-amber-200 shadow-xs">
            <span className="text-amber-300 font-black text-sm"><WebsiteText original={"ॐ"} /></span>
            {babaImageUrl && <img
              src={babaImageUrl}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== BABA_PUBLIC_DOMAIN_FALLBACK) img.src = BABA_PUBLIC_DOMAIN_FALLBACK;
              }}
              alt={websiteText("Baba Neem Karoli Ji")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover object-[center_28%] ring-2 ring-amber-300 shadow-lg bg-amber-50"
            />}
            <span className="text-xs sm:text-sm font-extrabold tracking-wide text-amber-100 font-cinzel whitespace-nowrap">
              {language === 'hi' ? websiteText("नीम करौली बाबा जी विचार :") : websiteText("Baba Neem Karoli Ji Quotes :")}
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
            title={websiteText("अगला विचार (Next Quote)")}
          >
            <RotateCw
              className={`w-3 h-3 text-amber-300 transition-transform ${
                isRotating ? "rotate-180" : ''
              }`}
            />
            <span className="hidden md:inline font-sans">
              {language === 'hi' ? websiteText("अन्य विचार") : websiteText("Next")}
            </span>
          </button>
        </div>

        {/* Auspicious Devotional Subtitle */}
        <div className="hidden lg:flex items-center gap-1.5 text-amber-200/90 text-xs font-serif italic shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span><WebsiteText original={"सब दुख दूर करें संकटमोचन हनुमान जी"} /></span>
        </div>
      </div>
    </div>
  );
};
