import React, { useState, useMemo } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { YouTubeVideoItem } from '../types';
import {
  Search,
  Play,
  CheckCircle,
  Clock,
  Eye,
  FileEdit,
  ExternalLink,
  Sparkles,
  Link2,
  Tv,
  X,
  Compass,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

export const YouTubeLearner: React.FC = () => {
  const {
    youtubeVideos,
    selectedSubject,
    selectedClass,
    language
  } = useCurriculum();

  const [activeVideo, setActiveVideo] = useState<YouTubeVideoItem>(youtubeVideos[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [notesText, setNotesText] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: language === 'hi' ? 'सभी व्याख्यान' : 'All Lectures' },
    { id: 'c10-science', label: language === 'hi' ? 'कक्षा 10 विज्ञान' : 'Class 10 Science' },
    { id: 'c10-math-std', label: language === 'hi' ? 'कक्षा 10 गणित' : 'Class 10 Maths' },
    { id: 'c10-it', label: language === 'hi' ? 'कक्षा 10 IT 402' : 'IT 402' },
    { id: 'c10-hindi-a', label: language === 'hi' ? 'कक्षा 10 हिन्दी' : 'Hindi Course A' },
    { id: 'c12-phy', label: language === 'hi' ? 'कक्षा 12 भौतिकी' : 'Class 12 Physics' },
    { id: 'c12-chem', label: language === 'hi' ? 'कक्षा 12 रसायन' : 'Class 12 Chemistry' }
  ];

  const popularSearches = [
    'Chemical Reactions',
    'Electricity',
    'Light Refraction',
    'Trigonometry',
    'Polynomials',
    'Life Processes',
    'IT 402',
    'Netaji Ka Chashma',
    'Class 12 Physics',
    'Solutions Chemistry'
  ];

  // Helper to extract YouTube video ID from links or raw ID
  const extractVideoId = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (trimmed.includes('v=')) {
      return trimmed.split('v=')[1].split('&')[0];
    }
    if (trimmed.includes('youtu.be/')) {
      return trimmed.split('youtu.be/')[1].split('?')[0];
    }
    if (trimmed.includes('/embed/')) {
      return trimmed.split('/embed/')[1].split('?')[0];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  // Comprehensive multi-keyword search engine logic
  const filteredVideos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return youtubeVideos.filter((v) => {
      // If a category is selected AND no specific search query is typed, apply category filter
      if (selectedCategory !== 'all' && !term && v.subjectId !== selectedCategory) {
        return false;
      }

      // If search query is typed, match across ALL fields
      if (term) {
        const titleMatch = v.title.toLowerCase().includes(term);
        const hindiMatch = (v.hindiTitle || '').toLowerCase().includes(term);
        const channelMatch = v.channelTitle.toLowerCase().includes(term);
        const descMatch = v.description.toLowerCase().includes(term);
        const tagMatch = v.tags?.some((t) => t.toLowerCase().includes(term));
        const subMatch = (v.subjectId || '').toLowerCase().includes(term);
        const classMatch = (v.classGrade || '').toLowerCase().includes(term);

        return titleMatch || hindiMatch || channelMatch || descMatch || tagMatch || subMatch || classMatch;
      }

      return true;
    });
  }, [youtubeVideos, searchTerm, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    // Check if the user pasted a direct YouTube link or ID into the main search engine
    const detectedId = extractVideoId(query);
    if (detectedId) {
      const customVid: YouTubeVideoItem = {
        id: 'direct-' + Date.now(),
        youtubeId: detectedId,
        title: `Direct YouTube Stream (${detectedId})`,
        channelTitle: 'Direct YouTube Stream',
        duration: 'Online',
        views: 'Direct Play',
        thumbnail: `https://img.youtube.com/vi/${detectedId}/hqdefault.jpg`,
        board: 'CBSE',
        classGrade: selectedClass,
        subjectId: 'custom',
        chapterId: 'custom-ch',
        description: 'Direct YouTube video loaded via Saarthi Search Engine.',
        approved: false,
        published: false,
        createdAt: new Date().toISOString()
      };
      setActiveVideo(customVid);
      return;
    }

    // If local results exist, automatically load the top match into the player!
    if (filteredVideos.length > 0) {
      setActiveVideo(filteredVideos[0]);
    }
  };

  const handleSaveNote = () => {
    if (notesText.trim()) {
      setSavedNotes([notesText.trim(), ...savedNotes]);
      setNotesText('');
    }
  };

  const handleLoadCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractVideoId(customUrl);
    if (!cleanId) return;

    const customVidItem: YouTubeVideoItem = {
      id: 'custom-' + Date.now(),
      youtubeId: cleanId,
      title: `Custom Lecture (${cleanId})`,
      channelTitle: 'YouTube Educator',
      duration: 'Live',
      views: 'Selected',
      thumbnail: `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
      board: 'CBSE',
      classGrade: selectedClass,
      subjectId: selectedSubject?.id || 'general',
      chapterId: 'ch-custom',
      description: 'Custom video loaded by student/teacher for concurrent study.',
      approved: false,
      published: false,
      createdAt: new Date().toISOString()
    };

    setActiveVideo(customVidItem);
    setCustomUrl('');
  };

  const openFullYouTubeSearch = (query: string) => {
    const targetQuery = query.trim() || 'Class 10 CBSE NCERT Lectures';
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(targetQuery + ' ' + selectedClass)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-4 sm:p-6 flex flex-col gap-5 min-w-0">
      {/* Header & Comprehensive Search Engine Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white text-red-600 rounded-xl shadow-xs">
                <Tv className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-cinzel">
                {language === 'hi' ? 'यूट्यूब स्मार्ट सर्च इंजन' : 'YouTube Smart Search Engine'}
              </h2>
            </div>
            <p className="text-xs text-orange-100 mt-1">
              {language === 'hi'
                ? 'कोई भी अध्याय, विषय, प्रश्न या यूट्यूब लिंक लिखें और तुरंत वीडियो देखें'
                : 'Search any chapter, concept, board PYQ or paste any YouTube link to play instantly'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/30 text-white">
              {filteredVideos.length} {language === 'hi' ? 'व्याख्यान उपलब्ध' : 'Lectures Available'}
            </span>
          </div>
        </div>

        {/* The Main High-Performance Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 mt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                language === 'hi'
                  ? 'अध्याय, टॉपिक खोजें (जैसे: Electricity, Chemical Reactions, Trigonometry या YouTube URL)...'
                  : 'Search topics, formulas, chapters or paste any YouTube link/ID...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white text-stone-900 rounded-xl outline-none focus:ring-2 focus:ring-amber-300 shadow-inner placeholder:text-stone-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-700 rounded-full"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-4 sm:px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Trending / Popular Topic Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-200 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'त्वरित खोज:' : 'Trending:'}</span>
          </span>
          {popularSearches.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setSearchTerm(chip);
                setSelectedCategory('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                searchTerm.toLowerCase() === chip.toLowerCase()
                  ? 'bg-amber-400 text-stone-900 shadow-xs'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills & Active Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {searchTerm && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500">
              {language === 'hi' ? 'सर्च परिणाम:' : 'Filter applied:'} <strong>"{searchTerm}"</strong>
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-orange-600 hover:underline font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'hi' ? 'रीसेट' : 'Clear'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Video Theater Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player & Active Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Official Embedded Player with Autoplay */}
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-900">
            {activeVideo?.youtubeId ? (
              <iframe
                key={activeVideo.youtubeId}
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs gap-2">
                <Play className="w-8 h-8 text-red-500 animate-pulse" />
                <span>Select a video from the list or search a topic</span>
              </div>
            )}
          </div>

          {/* Action Row: Direct YouTube Open & Custom Video Link Runner */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-stone-50 border border-stone-200 p-2.5 rounded-xl">
            {/* External YouTube Link Button */}
            {activeVideo && (
              <a
                href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <span>{language === 'hi' ? 'यूट्यूब ऐप/साइट पर देखें' : 'Watch on YouTube App'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Custom Link / ID Runner */}
            <form onSubmit={handleLoadCustomVideo} className="flex items-center gap-1.5 text-xs flex-1 max-w-sm ml-auto">
              <div className="relative flex-1">
                <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                <input
                  type="text"
                  placeholder={language === 'hi' ? 'अन्य कोई लिंक या Video ID पेस्ट करें...' : 'Paste any YouTube link / Video ID...'}
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-red-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-lg text-xs whitespace-nowrap"
              >
                {language === 'hi' ? 'चलाएं' : 'Run'}
              </button>
            </form>
          </div>

          {/* Video Metadata */}
          {activeVideo && (
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                {language === 'hi' && activeVideo.hindiTitle ? activeVideo.hindiTitle : activeVideo.title}
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {activeVideo.channelTitle.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-stone-800 flex items-center gap-1">
                      <span>{activeVideo.channelTitle}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />
                    </div>
                    <span className="text-[11px] text-stone-400">Verified Board Educator</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-stone-500 text-xs">
                  {activeVideo.views && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-stone-400" /> {activeVideo.views}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" /> {activeVideo.duration}
                  </span>
                </div>
              </div>

              {/* Description & Tags */}
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                {activeVideo.description}
              </p>

              {activeVideo.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeVideo.tags.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSearchTerm(t)}
                      className="text-[11px] bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-lg font-medium transition-colors"
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Notes Alongside Video */}
          <div className="mt-4 bg-amber-50/50 border border-orange-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-cinzel">
              <FileEdit className="w-4 h-4 text-orange-600" />
              <span>{language === 'hi' ? 'व्याख्यान नोट्स व सूत्र संकलन' : 'Lecture Scratchpad & Quick Revision Notes'}</span>
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={language === 'hi' ? 'वीडियो देखते समय कोई मुख्य बिंदु, सूत्र या प्रश्न यहाँ नोट करें...' : 'Jot down a formula, timestamp, or key concept while watching...'}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                {language === 'hi' ? 'जोड़ें' : 'Add Note'}
              </button>
            </div>

            {savedNotes.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {savedNotes.map((n, i) => (
                  <div
                    key={i}
                    className="text-xs bg-white p-2 rounded-lg border border-amber-200 text-stone-700 flex items-center justify-between"
                  >
                    <span>• {n}</span>
                    <span className="text-[10px] text-stone-400">Just now</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Search Results & Video Playlist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-stone-100 pb-2">
            <span>
              {language === 'hi' ? 'सर्च परिणाम' : 'Search Results'} ({filteredVideos.length})
            </span>
            <span className="text-[10px] text-orange-600 font-semibold">{selectedClass}</span>
          </div>

          {/* If No Match in Local Library, Provide 1-Click Search YouTube Online */}
          {filteredVideos.length === 0 ? (
            <div className="bg-amber-50 border border-orange-200 rounded-2xl p-4 text-center space-y-3">
              <Compass className="w-8 h-8 text-orange-600 mx-auto" />
              <div>
                <h4 className="text-xs font-bold text-stone-800">
                  {language === 'hi' ? 'लाइब्रेरी में कोई सीधा वीडियो नहीं मिला' : 'No local video matched your search'}
                </h4>
                <p className="text-[11px] text-stone-500 mt-1">
                  "{searchTerm}" {language === 'hi' ? 'के लिए सीधे पूरे यूट्यूब पर खोजें:' : 'Search YouTube directly:'}
                </p>
              </div>

              <button
                onClick={() => openFullYouTubeSearch(searchTerm)}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{language === 'hi' ? 'यूट्यूब पर लाइव खोजें' : 'Search on YouTube Live'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSearchTerm('')}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline block mx-auto"
              >
                {language === 'hi' ? 'सभी वीडियो वापस देखें' : 'View all videos'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredVideos.map((vid) => {
                const isPlaying = activeVideo?.youtubeId === vid.youtubeId;

                return (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className={`cursor-pointer rounded-xl p-2 transition-all flex gap-3 group ${
                      isPlaying
                        ? 'bg-orange-100/80 border-2 border-orange-400 shadow-xs'
                        : 'hover:bg-stone-50 border border-stone-200'
                    }`}
                  >
                    {/* Thumbnail with duration badge */}
                    <div className="relative w-28 h-18 sm:w-32 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-stone-900 shadow-xs">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 rounded">
                        {vid.duration}
                      </span>
                      {isPlaying && (
                        <div className="absolute inset-0 bg-orange-600/40 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-white animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h5
                        className={`text-xs font-bold line-clamp-2 leading-tight ${
                          isPlaying ? 'text-orange-950 font-extrabold' : 'text-stone-800'
                        }`}
                      >
                        {language === 'hi' && vid.hindiTitle ? vid.hindiTitle : vid.title}
                      </h5>
                      <p className="text-[11px] text-stone-500 mt-1 truncate">
                        {vid.channelTitle}
                      </p>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        {vid.views}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Online YouTube Fallback Button at end of list */}
              <div className="pt-2 border-t border-stone-100">
                <button
                  onClick={() => openFullYouTubeSearch(searchTerm || 'Class 10 CBSE')}
                  className="w-full py-2 bg-stone-100 hover:bg-orange-100 border border-stone-200 text-stone-700 hover:text-orange-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-red-600" />
                  <span>
                    {language === 'hi' ? 'यूट्यूब पर और अधिक व्याख्यान खोजें' : 'Search more on YouTube'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
