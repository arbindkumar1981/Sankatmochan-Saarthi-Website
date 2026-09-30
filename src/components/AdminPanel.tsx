import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import {
  LearningContent,
  YouTubeVideoItem,
  EvaluationTest,
  NoticeItem,
  ContactEnquiry,
  ContentModuleType,
  BoardType,
  ClassGrade,
  StreamType
} from '../types';
import {
  ShieldCheck,
  Users,
  BookOpen,
  FileText,
  Youtube,
  CheckSquare,
  BellRing,
  Inbox,
  Plus,
  Check,
  X,
  Trash2,
  Edit,
  Eye,
  Archive,
  Image as ImageIcon,
  Save,
  Sparkles,
  Search
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    learningContents,
    youtubeVideos,
    evaluationTests,
    notices,
    testResults,
    addNewLearningContent,
    updateContentApproval,
    deleteLearningContent,
    addNewVideo,
    addNewTest,
    addNewNotice,
    babaImageUrl,
    setBabaImageUrl,
    selectedBoard,
    selectedClass,
    selectedStream,
    selectedSubject,
    language
  } = useCurriculum();

  const { profile } = useAuth();

  const [adminTab, setAdminTab] = useState<
    'content' | 'videos' | 'tests' | 'notices' | 'students' | 'enquiries' | 'settings'
  >('content');

  // New Content Form State
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentTitle, setContentTitle] = useState('');
  const [contentHindiTitle, setContentHindiTitle] = useState('');
  const [contentType, setContentType] = useState<ContentModuleType>('detailed_notes');
  const [contentBody, setContentBody] = useState('');
  const [contentHindiBody, setContentHindiBody] = useState('');

  // New Video Form State
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoYoutubeId, setVideoYoutubeId] = useState('');
  const [videoChannel, setVideoChannel] = useState('Sankatmochan Academy');
  const [videoDuration, setVideoDuration] = useState('35:00');

  // New Notice Form State
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeHindiTitle, setNoticeHindiTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeHindiMessage, setNoticeHindiMessage] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'motivational' | 'academic' | 'urgent'>('motivational');
  const [noticeQuote, setNoticeQuote] = useState('');

  // Custom photo setting
  const [newPhotoUrl, setNewPhotoUrl] = useState(babaImageUrl);
  const [photoSaved, setPhotoSaved] = useState(false);

  // Local enquiries state
  const [enquiriesList, setEnquiriesList] = useState<ContactEnquiry[]>(() => {
    return JSON.parse(localStorage.getItem('saarthi_enquiries') || '[]');
  });

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim()) return;

    await addNewLearningContent({
      contentType,
      board: selectedBoard,
      classGrade: selectedClass,
      stream: selectedStream,
      subjectId: selectedSubject?.id || 'c10-science',
      subjectName: selectedSubject?.name || 'Science',
      chapterId: selectedSubject?.chapters[0]?.id || 'ch-1',
      chapterTitle: selectedSubject?.chapters[0]?.title || 'Chapter 1',
      title: contentTitle.trim(),
      hindiTitle: contentHindiTitle.trim() || undefined,
      bodyText: contentBody.trim(),
      bodyHindi: contentHindiBody.trim() || undefined,
      version: 1,
      approved: true,
      published: true,
      authorUid: profile?.uid || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setContentTitle('');
    setContentHindiTitle('');
    setContentBody('');
    setContentHindiBody('');
    setShowContentForm(false);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoYoutubeId.trim()) return;

    // clean youtube ID if user pasted full URL
    let cleanId = videoYoutubeId.trim();
    if (cleanId.includes('v=')) {
      cleanId = cleanId.split('v=')[1].split('&')[0];
    } else if (cleanId.includes('youtu.be/')) {
      cleanId = cleanId.split('youtu.be/')[1].split('?')[0];
    }

    await addNewVideo({
      youtubeId: cleanId,
      title: videoTitle.trim(),
      channelTitle: videoChannel.trim(),
      duration: videoDuration.trim() || '30:00',
      views: '1K views',
      thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=640&auto=format&fit=crop`,
      board: selectedBoard,
      classGrade: selectedClass,
      subjectId: selectedSubject?.id || 'c10-science',
      chapterId: selectedSubject?.chapters[0]?.id || 'ch-1',
      description: 'Curated official lecture approved by Sankatmochan Saarthi Academic Board.',
      tags: ['Board Lecture', selectedClass],
      approved: true,
      published: true,
      createdAt: new Date().toISOString()
    });

    setVideoTitle('');
    setVideoYoutubeId('');
    setShowVideoForm(false);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) return;

    await addNewNotice({
      title: noticeTitle.trim(),
      hindiTitle: noticeHindiTitle.trim() || undefined,
      message: noticeMessage.trim(),
      hindiMessage: noticeHindiMessage.trim() || undefined,
      category: noticeCategory,
      blessingQuote: noticeQuote.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: profile?.displayName || 'Principal A. Kumar'
    });

    setNoticeTitle('');
    setNoticeHindiTitle('');
    setNoticeMessage('');
    setNoticeHindiMessage('');
    setNoticeQuote('');
    setShowNoticeForm(false);
  };

  const handleSavePhotoSettings = () => {
    if (newPhotoUrl.trim()) {
      setBabaImageUrl(newPhotoUrl.trim());
      setPhotoSaved(true);
      setTimeout(() => setPhotoSaved(false), 2000);
    }
  };

  const handleResolveEnquiry = (enquiryId: string) => {
    const updated = enquiriesList.map((enq) =>
      enq.id === enquiryId ? { ...enq, status: 'resolved' as const } : enq
    );
    setEnquiriesList(updated);
    localStorage.setItem('saarthi_enquiries', JSON.stringify(updated));
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border-2 border-red-500/80 shadow-md p-4 sm:p-6 flex flex-col gap-6 min-w-0">
      {/* Admin Header */}
      <div className="border-b border-orange-200 pb-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-4 rounded-2xl border border-red-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-700 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 font-cinzel">
              Centralized Administration & Curriculum Control
            </h2>
            <p className="text-xs text-red-900 font-medium">
              Logged in as: <span className="font-bold">{profile?.displayName || 'Principal A. Kumar'}</span> ({profile?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200">
            Secure RBAC Mode
          </span>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl text-xs font-bold">
        <button
          onClick={() => setAdminTab('content')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'content'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-orange-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Learning Materials ({learningContents.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('videos')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'videos'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-red-600'
          }`}
        >
          <Youtube className="w-3.5 h-3.5" />
          <span>YouTube Lectures ({youtubeVideos.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('tests')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'tests'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-emerald-600'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Assessment Tests ({evaluationTests.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('notices')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'notices'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-amber-600'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Notice Board ({notices.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('students')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'students'
              ? 'bg-stone-800 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Records</span>
        </button>

        <button
          onClick={() => setAdminTab('enquiries')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'enquiries'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-blue-600'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Enquiries Desk</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            adminTab === 'settings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-purple-600'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Baba Ji Photo Settings</span>
        </button>
      </div>

      {/* Admin Tab 1: Content Manager */}
      {adminTab === 'content' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
              Curriculum Content Repository (Add / Edit / Approve / Publish)
            </h3>
            <button
              onClick={() => setShowContentForm(!showContentForm)}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showContentForm ? 'Cancel' : 'Add New Content'}</span>
            </button>
          </div>

          {showContentForm && (
            <form onSubmit={handleCreateContent} className="bg-amber-50/60 border border-orange-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-orange-950 font-cinzel">New Curriculum Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    English Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="e.g. Master Guide: Quadratic Equations"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Hindi Title
                  </label>
                  <input
                    type="text"
                    value={contentHindiTitle}
                    onChange={(e) => setContentHindiTitle(e.target.value)}
                    placeholder="e.g. द्विघात समीकरण सम्पूर्ण मार्गदर्शिका"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Module Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                >
                  <option value="detailed_notes">Detailed Notes</option>
                  <option value="revision_notes">Revision Notes</option>
                  <option value="formulae">Definitions & Formulae</option>
                  <option value="mindmaps">Mind Maps</option>
                  <option value="flashcards">Flashcards</option>
                  <option value="pyqs">Previous Year Questions</option>
                  <option value="cbqs">Competency Questions</option>
                  <option value="case_studies">Case Study</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Body Text (Markdown supported)
                </label>
                <textarea
                  rows={4}
                  value={contentBody}
                  onChange={(e) => setContentBody(e.target.value)}
                  placeholder="Enter detailed pedagogical notes..."
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Save & Publish to Curriculum
              </button>
            </form>
          )}

          {/* List of existing contents */}
          <div className="space-y-2">
            {learningContents.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-white border border-stone-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[10px] uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                      {c.contentType}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {c.board} • {c.classGrade} • {c.subjectName}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{c.title}</h4>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                    Version: v{c.version} • Status: {c.published ? 'Published' : 'Draft'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateContentApproval(c.id, !c.approved, !c.published)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      c.approved
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {c.approved ? 'Approved ✓' : 'Approve & Publish'}
                  </button>

                  <button
                    onClick={() => deleteLearningContent(c.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Tab 2: Videos */}
      {adminTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
              YouTube Video Library
            </h3>
            <button
              onClick={() => setShowVideoForm(!showVideoForm)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showVideoForm ? 'Cancel' : 'Add Curated Video'}</span>
            </button>
          </div>

          {showVideoForm && (
            <form onSubmit={handleCreateVideo} className="bg-red-50/50 border border-red-200 p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Lecture Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g. Electric Current and Ohm's Law One Shot"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    YouTube URL or ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoYoutubeId}
                    onChange={(e) => setVideoYoutubeId(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or ID"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={videoChannel}
                    onChange={(e) => setVideoChannel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="35:00"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Add Video to Platform
              </button>
            </form>
          )}

          <div className="space-y-2">
            {youtubeVideos.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 rounded bg-stone-900 overflow-hidden shrink-0">
                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 line-clamp-1">{v.title}</h5>
                    <span className="text-[11px] text-stone-500 font-mono">
                      ID: {v.youtubeId} • Channel: {v.channelTitle}
                    </span>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Approved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Tab 3: Notices */}
      {adminTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
              Motivational Circulars & Notice Board
            </h3>
            <button
              onClick={() => setShowNoticeForm(!showNoticeForm)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNoticeForm ? 'Cancel' : 'Post Notice'}</span>
            </button>
          </div>

          {showNoticeForm && (
            <form onSubmit={handleCreateNotice} className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. CBSE Practical Exam Schedule Announced"
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Detailed Announcement Message *
                </label>
                <textarea
                  rows={3}
                  required
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  placeholder="Official circular details..."
                  className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none"
                  >
                    <option value="motivational">Motivational Blessing</option>
                    <option value="academic">Academic Update</option>
                    <option value="urgent">Urgent Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Blessing Quote (Optional)
                  </label>
                  <input
                    type="text"
                    value={noticeQuote}
                    onChange={(e) => setNoticeQuote(e.target.value)}
                    placeholder="e.g. Sub dukh door karein Sankatmochan Hanuman Ji"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white outline-none font-serif italic"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Publish Notice
              </button>
            </form>
          )}

          <div className="space-y-2">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-white border border-stone-200 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{n.title}</span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Tab 4: Students */}
      {adminTab === 'students' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
            Registered Student Directory & Test History
          </h3>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-700 grid grid-cols-4">
              <span>Student / Name</span>
              <span>Class & Board</span>
              <span>Tests Completed</span>
              <span>Recent Score</span>
            </div>

            <div className="p-3 divide-y divide-stone-100 text-xs text-stone-800">
              <div className="py-2.5 grid grid-cols-4 items-center">
                <div>
                  <span className="font-bold block">Arbind Kumar (AK)</span>
                  <span className="text-[11px] text-stone-400 font-mono">principal.a.kumar@gmail.com</span>
                </div>
                <div>Class 10 • CBSE</div>
                <div className="font-bold text-orange-700">{testResults.length} Tests</div>
                <div className="font-bold text-emerald-700">
                  {testResults[0] ? `${testResults[0].percentage}%` : '85%'}
                </div>
              </div>

              <div className="py-2.5 grid grid-cols-4 items-center">
                <div>
                  <span className="font-bold block">Anaya Sharma</span>
                  <span className="text-[11px] text-stone-400 font-mono">anaya.s@school.in</span>
                </div>
                <div>Class 12 • CBSE (Science)</div>
                <div className="font-bold text-orange-700">4 Tests</div>
                <div className="font-bold text-emerald-700">92%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab 5: Enquiries */}
      {adminTab === 'enquiries' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-cinzel">
            Student & Parent Enquiries Desk ({enquiriesList.length})
          </h3>

          {enquiriesList.length === 0 ? (
            <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border text-xs">
              No pending enquiries in inbox.
            </div>
          ) : (
            <div className="space-y-3">
              {enquiriesList.map((enq) => (
                <div
                  key={enq.id}
                  className="p-4 bg-white border border-stone-200 rounded-2xl text-xs space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 text-sm">{enq.name}</span>
                      <span className="text-stone-500 ml-2 font-mono">({enq.email})</span>
                      {enq.phone && <span className="text-stone-500 ml-2">• {enq.phone}</span>}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        enq.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {enq.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="font-semibold text-orange-900">
                    Subject: {enq.subjectQuery} ({enq.classGrade})
                  </div>

                  <p className="text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200 leading-relaxed">
                    "{enq.message}"
                  </p>

                  {enq.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveEnquiry(enq.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Mark as Replied & Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Tab 6: Baba Neem Karoli Ji Photo Settings */}
      {adminTab === 'settings' && (
        <div className="bg-amber-50/50 border border-orange-200 p-5 rounded-2xl space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-400 p-0.5 bg-white shadow-md">
              <img
                src={babaImageUrl}
                alt="Baba Neem Karoli Ji"
                className="w-full h-full object-cover object-top rounded-full bg-amber-900"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 font-cinzel">
                Revered Baba Neem Karoli Ji’s Photo Configuration
              </h3>
              <p className="text-xs text-stone-600">
                Official sacred darshan photo of Maharaj-ji. It updates automatically at the top of every page across the platform.
              </p>
            </div>
          </div>

          {/* Quick Presets of Authentic Original Photographs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Authentic Original Photo Presets:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Shri_Neem_Karoli_Baba.png';
                  setNewPhotoUrl(url);
                  setBabaImageUrl(url);
                  setPhotoSaved(true);
                  setTimeout(() => setPhotoSaved(false), 2000);
                }}
                className="p-2 text-left bg-white border border-orange-300 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 transition-all flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-orange-400">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Shri_Neem_Karoli_Baba.png"
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="text-[11px] leading-tight font-semibold text-stone-800">
                  <span>मूल पावन स्वरूप (कंबल वाले बाबा)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG/640px-Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG';
                  setNewPhotoUrl(url);
                  setBabaImageUrl(url);
                  setPhotoSaved(true);
                  setTimeout(() => setPhotoSaved(false), 2000);
                }}
                className="p-2 text-left bg-white border border-orange-300 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 transition-all flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-orange-400">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG/640px-Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG"
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="text-[11px] leading-tight font-semibold text-stone-800">
                  <span>समाधि मंदिर वृन्दावन दर्शन</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Custom Image URL:
            </label>
            <input
              type="text"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePhotoSettings}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Update Everywhere</span>
            </button>
            {photoSaved && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Updated successfully!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
