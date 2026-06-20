import React, { useState, useRef, useEffect } from 'react';
import { formatTotalHours } from '../../lib/timeMetrics';
import packageJson from '../../../package.json';
import { toPng } from 'html-to-image';
import { openPath } from '@tauri-apps/plugin-opener';
import { downloadDir } from '@tauri-apps/api/path';

interface ProfileCardPreviewProps {
  // Profile
  userName: string;
  userAvatar: string;
  selectedTheme: { id: string; name: string; css: string; colors: string[] };

  // Monthly Wrap
  recapMonth: number;
  recapYear: number;
  monthlyRecap: {
    minutes: number;
    completedCount: number;
    averageRating: string;
    trinity: any[];
    masterpiece: any | null;
    badMedia: any | null;
    topGenre: string;
    topGenres: { genre: string; count: number }[];
    genreHighlight: any | null;
    autoHighlightPhrase: string;
    highlightPhrase: string;
  };
  monthsList: string[];
}

export const ProfileCardPreview: React.FC<ProfileCardPreviewProps> = ({
  userName,
  userAvatar,
  selectedTheme,
  recapMonth,
  recapYear,
  monthlyRecap,
  monthsList,
}) => {
  const [previewType, setPreviewType] = useState<'desktop' | 'story'>('desktop');
  const [scale, setScale] = useState(0.35);
  const [storyScale, setStoryScale] = useState(0.5);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const desktopInnerRef = useRef<HTMLDivElement>(null);
  const storyInnerRef = useRef<HTMLDivElement>(null);

  // Update scales
  useEffect(() => {
    const updateScales = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        setScale(containerRef.current.clientWidth / 1200);
      }
      if (storyContainerRef.current && storyContainerRef.current.clientWidth > 0) {
        setStoryScale(storyContainerRef.current.clientWidth / 450);
      }
    };

    const timer = setTimeout(updateScales, 50);
    window.addEventListener('resize', updateScales);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScales);
    };
  }, [previewType, monthlyRecap.completedCount]);

  const handleExportDesktop = async () => {
    if (!desktopInnerRef.current) return;
    try {
      const fileName = `grabbe-monthly-banner-${monthsList[recapMonth].toLowerCase()}-${recapYear}.png`;
      const dataUrl = await toPng(desktopInnerRef.current, {
        width: 1200,
        height: 630,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          left: '0',
          top: '0',
        },
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      setDownloadedFile(fileName);
      setShowNotification(true);
    } catch (err) {
      console.error('Failed to export desktop banner:', err);
    }
  };

  const handleExportStory = async () => {
    if (!storyInnerRef.current) return;
    try {
      const fileName = `grabbe-monthly-story-${monthsList[recapMonth].toLowerCase()}-${recapYear}.png`;
      const dataUrl = await toPng(storyInnerRef.current, {
        width: 450,
        height: 800,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          left: '0',
          top: '0',
        },
        pixelRatio: 2.4, // 450 * 2.4 = 1080, 800 * 2.4 = 1920 (Standard HD Story size)
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      setDownloadedFile(fileName);
      setShowNotification(true);
    } catch (err) {
      console.error('Failed to export story banner:', err);
    }
  };

  const handleShowInFolder = async () => {
    try {
      const dir = await downloadDir();
      await openPath(dir);
    } catch (err) {
      console.error(err);
    }
  };

  const getRatingText = (score: number | null): string => {
    if (score === null || score === undefined) return 'N/A';
    if (score >= 10) return 'Masterpiece';
    if (score >= 9) return 'Amazing';
    if (score >= 8) return 'Great';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Decent';
    if (score >= 5) return 'Average';
    if (score >= 4) return 'Mediocre';
    if (score >= 3) return 'Appalling';
    if (score >= 2) return 'Awful';
    return 'Terrible';
  };

  const primaryColor = selectedTheme.colors[0];
  const secondaryColor = selectedTheme.colors[1];
  const tertiaryColor = '#cb4b16'; // default solarized orange

  return (
    <section className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        {/* Toggle between preview formats */}
        <div className="flex bg-[#001b22] border border-white/5 p-1 rounded-xl gap-1 select-none">
          <button
            onClick={() => setPreviewType('desktop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans ${previewType === 'desktop' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-high'
              }`}
          >
            Desktop (1200x630)
          </button>
          <button
            onClick={() => setPreviewType('story')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans ${previewType === 'story' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-high'
              }`}
          >
            Story (9:16)
          </button>
        </div>
      </div>

      {/* Previews */}
      <div className="w-full">
        {/* DESKTOP BANNER PREVIEW */}
        <div className={`space-y-4 ${previewType === 'desktop' ? '' : 'hidden'}`}>
          <div 
            ref={containerRef} 
            className="w-full aspect-[1200/630] relative overflow-hidden bg-[#001b22] rounded-2xl border border-white/5 shadow-2xl bloom-shadow"
          >
            <div 
              ref={desktopInnerRef}
              className="absolute top-0 left-0 origin-top-left select-none pointer-events-none"
              style={{
                width: '1200px',
                height: '630px',
                transform: `scale(${scale})`
              }}
            >
            {/* Glow Layer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 10% 90%, ${primaryColor}26 0%, transparent 65%)`
              }}
            />

            <div className="w-full h-full p-12 flex flex-col justify-between relative z-10 text-white font-sans">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full border-2 p-1 bg-[#002b36] overflow-hidden flex items-center justify-center text-3xl"
                    style={{ borderColor: `${primaryColor}4d` }}
                  >
                    {userAvatar.startsWith('http') ? (
                      <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={userAvatar} crossOrigin="anonymous" />
                    ) : (
                      <span>{userAvatar}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest font-bold opacity-60" style={{ color: secondaryColor }}>
                      Monthly Recap
                    </span>
                    <h1 className="text-2xl font-bold text-white mt-0.5">{userName || 'Anonymous Evaluator'}</h1>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-3xl" style={{ color: primaryColor, fontVariationSettings: "'FILL' 1" }}>insights</span>
                    <span className="text-3xl font-extrabold tracking-tighter" style={{ color: primaryColor }}>Grabbe</span>
                  </div>
                  <span className="text-xs font-bold text-text-muted mt-1 uppercase tracking-wider">
                    {monthsList[recapMonth]} {recapYear}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-12 gap-8 items-center mt-2">
                {/* Left: Masterpiece */}
                <div className="col-span-7 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl" style={{ color: secondaryColor }}>auto_awesome</span>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                      Masterpiece of the Month
                    </span>
                  </div>
                  <div className="p-6 bg-[#002b36]/60 border border-white/5 rounded-2xl flex gap-6 items-center shadow-xl">
                    <div className="relative w-36 h-52 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-[#001b22] flex items-center justify-center">
                      {monthlyRecap.masterpiece?.cover_image_path ? (
                        <img
                          alt="Masterpiece"
                          className="w-full h-full object-cover"
                          src={monthlyRecap.masterpiece.cover_image_path}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-white/20">movie_filter</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black italic tracking-tighter leading-none text-white">
                          {monthlyRecap.masterpiece?.score || 'Ø'}
                        </span>
                        <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Rating</span>
                      </div>
                      <h2 className="text-xl font-bold text-white mt-3 truncate">
                        {monthlyRecap.masterpiece?.title || 'No completed media'}
                      </h2>
                      <p className="text-xs text-[#eee8d5] line-clamp-3 mt-1.5 leading-relaxed">
                        {monthlyRecap.masterpiece?.description || 'No media completed this month to set as masterpiece. Track progress and rate items to highlight them!'}
                      </p>
                      <div className="mt-4 flex gap-3.5">
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs" style={{ color: secondaryColor }}>animation</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-text-high">
                            {monthlyRecap.masterpiece?.type || 'N/A'}
                          </span>
                        </div>
                        {monthlyRecap.masterpiece?.release_year && (
                          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs" style={{ color: primaryColor }}>calendar_month</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-text-high">
                              {monthlyRecap.masterpiece.release_year}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Bad Media & Highlight Quote */}
                <div className="col-span-5 flex flex-col gap-6">
                  {/* Bad Media */}
                  <div className="bg-[#002b36]/60 border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-md">
                    <div className="w-16 h-24 shrink-0 bg-[#001b22] border border-white/5 rounded-lg overflow-hidden flex items-center justify-center relative">
                      {monthlyRecap.badMedia?.cover_image_path ? (
                        <img
                          alt="Bad Media"
                          className="w-full h-full object-cover grayscale opacity-60"
                          src={monthlyRecap.badMedia.cover_image_path}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-white/20">heart_broken</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">sentiment_very_dissatisfied</span>
                        Bad Media of the Month
                      </span>
                      <h3 className="text-sm font-bold text-white truncate">
                        {monthlyRecap.badMedia?.title || 'No bad media'}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-red-400">
                            {monthlyRecap.badMedia?.score || 'Ø'}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted italic">
                          "{getRatingText(monthlyRecap.badMedia?.score)}"
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Highlight Quote */}
                  <div className="relative py-2 pl-4">
                    <span className="material-symbols-outlined absolute -top-4 -left-1 opacity-20 text-5xl" style={{ color: primaryColor }}>
                      format_quote
                    </span>
                    <p className="text-lg italic font-light text-white relative z-10 leading-snug">
                      "{monthlyRecap.highlightPhrase}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-2">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Total Consumido</span>
                    <span className="text-lg font-bold mt-0.5" style={{ color: primaryColor }}>
                      {formatTotalHours(monthlyRecap.minutes)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Monthly Media</span>
                    <span className="text-lg font-bold mt-0.5" style={{ color: secondaryColor }}>
                      {monthlyRecap.completedCount}
                    </span>
                  </div>
                  <div className="flex flex-col pl-2">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Top Genres</span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {monthlyRecap.topGenres && monthlyRecap.topGenres.length > 0 ? (
                        monthlyRecap.topGenres.map((g, idx) => (
                          <span key={g.genre} className="text-[10px] font-semibold text-white leading-tight">
                            {idx + 1}. {g.genre} <span className="opacity-60 font-medium">({g.count})</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-text-muted italic">None</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col border-l border-white/10 pl-6 gap-0.5">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                      Top Media (Month)
                    </span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {monthlyRecap.trinity && monthlyRecap.trinity.length > 0 ? (
                        monthlyRecap.trinity.map((item, idx) => (
                          <span key={item.id} className="text-[10px] font-semibold text-white truncate max-w-[280px] leading-tight">
                            {idx + 1}. {item.title} <span style={{ color: secondaryColor }}>★{item.score || 'Ø'}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-text-muted italic">None</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end opacity-40">
                  <span className="text-[10px] font-bold text-white">Generated by Grabbe</span>
                  <span className="text-[8px] text-text-muted tracking-widest mt-0.5">PERSONAL MEDIA ENGINE v{packageJson.version}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleExportDesktop}
            className="cursor-pointer bg-primary text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 primary-glow shadow-md shadow-primary/20 select-none font-sans"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Download Desktop Banner (1200x630)
          </button>
        </div>
      </div>

        {/* STORY BANNER PREVIEW */}
        <div className={`space-y-4 ${previewType === 'story' ? '' : 'hidden'}`}>
          <div
            ref={storyContainerRef}
            className="w-full max-w-[450px] mx-auto aspect-[450/800] relative overflow-hidden bg-[#001b22] rounded-2xl border border-white/5 shadow-2xl bloom-shadow"
          >
          <div
            ref={storyInnerRef}
            className="absolute top-0 left-0 origin-top-left select-none pointer-events-none"
            style={{
              width: '450px',
              height: '800px',
              transform: `scale(${storyScale})`
            }}
          >
            {/* Background elements */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at bottom right, ${secondaryColor}1f 0%, transparent 60%)`
              }}
            />

            <div className="w-full h-full p-6 flex flex-col justify-between relative z-10 text-white font-sans">
              {/* Header */}
              <header className="flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-full border bg-[#002b36] flex items-center justify-center text-xl shrink-0"
                    style={{ borderColor: `${primaryColor}4d` }}
                  >
                    {userAvatar.startsWith('http') ? (
                      <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={userAvatar} crossOrigin="anonymous" />
                    ) : (
                      <span>{userAvatar}</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-xs font-bold text-white leading-tight">{userName || 'Anonymous Evaluator'}</h1>
                    <p className="text-[9px] uppercase font-semibold mt-0.25" style={{ color: secondaryColor }}>
                      {monthsList[recapMonth]} {recapYear}
                    </p>
                  </div>
                </div>
                <div className="font-extrabold tracking-tighter text-xl" style={{ color: primaryColor }}>Grabbe</div>
              </header>

              {/* Masterpiece of the Month */}
              <section className="mt-4">
                <div className="bg-[#002b36]/60 border border-white/5 rounded-xl p-3 shadow-md">
                  <div className="flex gap-4">
                    <div className="relative shrink-0 w-20 aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-[#001b22] flex items-center justify-center">
                      {monthlyRecap.masterpiece?.cover_image_path ? (
                        <img
                          alt="Masterpiece"
                          className="w-full h-full object-cover"
                          src={monthlyRecap.masterpiece.cover_image_path}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-white/20">movie_filter</span>
                      )}
                      <div
                        className="absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-bold text-white rounded-br shadow"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {monthlyRecap.masterpiece?.score || 'Ø'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] uppercase tracking-[0.2em] font-bold" style={{ color: secondaryColor }}>
                          Monthly Masterpiece
                        </span>
                        <span className="material-symbols-outlined text-xs" style={{ color: secondaryColor }}>stars</span>
                      </div>
                      <h2 className="text-sm font-bold text-white truncate">
                        {monthlyRecap.masterpiece?.title || 'No completed media'}
                      </h2>
                      <p className="text-[10px] text-[#eee8d5] line-clamp-3 mt-1 leading-normal">
                        {monthlyRecap.masterpiece?.description || 'No media completed this month to set as masterpiece.'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Narrative Quote */}
              <section className="py-2 flex flex-col gap-1">
                <blockquote className="text-md italic font-light text-white leading-snug">
                  "{monthlyRecap.highlightPhrase}"
                </blockquote>
                {monthlyRecap.genreHighlight && (
                  <p className="text-[10px] border-l-2 pl-2.5 italic mt-1.5" style={{ color: `${secondaryColor}e6`, borderColor: `${secondaryColor}80` }}>
                    Top {monthlyRecap.topGenre}: "{monthlyRecap.genreHighlight.title}" (Score {monthlyRecap.genreHighlight.score})
                  </p>
                )}
              </section>

              {/* Bad Media */}
              {monthlyRecap.badMedia && (
                <section>
                  <div className="bg-[#002b36]/60 border border-white/5 p-3 rounded-xl flex items-center gap-3 shadow">
                    <div className="w-10 h-10 rounded overflow-hidden bg-[#001b22] border border-white/5 shrink-0 flex items-center justify-center relative">
                      {monthlyRecap.badMedia.cover_image_path ? (
                        <img
                          alt="Bad Media"
                          className="w-full h-full object-cover grayscale opacity-60"
                          src={monthlyRecap.badMedia.cover_image_path}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-lg text-white/20">heart_broken</span>
                      )}
                      <div className="absolute top-0 left-0 bg-red-500 text-white px-1 text-[8px] font-bold rounded-br leading-none py-0.5">
                        {monthlyRecap.badMedia.score}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[8px] text-red-400 font-bold uppercase tracking-widest">Bad Media of the Month</span>
                      <h3 className="text-xs font-bold text-white truncate">{monthlyRecap.badMedia.title}</h3>
                      <div className="mt-0.5 flex items-center">
                        <span className="text-[7px] text-red-400 px-1 py-0.25 bg-red-500/10 rounded uppercase font-bold tracking-wider">
                          {getRatingText(monthlyRecap.badMedia.score)}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Bento Grid */}
              <section className="grid grid-cols-2 gap-3 mt-3">
                <div
                  className="bg-[#002b36]/60 border border-white/5 rounded-xl flex flex-col justify-between h-20 p-2.5 shadow border-t-2"
                  style={{ borderTopColor: secondaryColor }}
                >
                  <span className="material-symbols-outlined text-lg" style={{ color: secondaryColor }}>trending_up</span>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-text-muted font-bold">Monthly Media</p>
                    <p className="text-sm font-bold text-white mt-0.5">{monthlyRecap.completedCount}</p>
                  </div>
                </div>

                <div
                  className="bg-[#002b36]/60 border border-white/5 rounded-xl flex flex-col justify-between h-20 p-2.5 shadow border-t-2"
                  style={{ borderTopColor: primaryColor }}
                >
                  <span className="material-symbols-outlined text-lg" style={{ color: primaryColor }}>schedule</span>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-text-muted font-bold">Total Consumed</p>
                    <p className="text-sm font-bold text-white mt-0.5">{formatTotalHours(monthlyRecap.minutes)}</p>
                  </div>
                </div>

                <div
                  className="bg-[#002b36]/60 border border-white/5 rounded-xl flex flex-col justify-between p-3 col-span-2 shadow border-t-2 gap-2 min-h-[90px]"
                  style={{ borderTopColor: tertiaryColor }}
                >
                  <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-lg" style={{ color: tertiaryColor }}>insights</span>
                    <span className="text-[8px] uppercase tracking-wider text-text-muted font-bold">Monthly Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1 text-left">
                    {/* Left: Top Obras */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Top Media</span>
                      <div className="flex flex-col gap-0.5">
                        {monthlyRecap.trinity && monthlyRecap.trinity.length > 0 ? (
                          monthlyRecap.trinity.map((item, idx) => (
                            <span key={item.id} className="text-[9px] font-semibold text-white truncate leading-tight">
                              {idx + 1}. {item.title} <span style={{ color: secondaryColor }} className="font-bold">★{item.score || 'Ø'}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-text-muted italic">None</span>
                        )}
                      </div>
                    </div>
                    {/* Right: Top Gêneros */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Top Genres</span>
                      <div className="flex flex-col gap-0.5">
                        {monthlyRecap.topGenres && monthlyRecap.topGenres.length > 0 ? (
                          monthlyRecap.topGenres.map((g, idx) => (
                            <span key={g.genre} className="text-[9px] font-semibold text-white truncate leading-tight">
                              {idx + 1}. {g.genre} <span className="opacity-60 font-medium">({g.count})</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-text-muted italic">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Footer */}
              <footer className="text-center mt-4 pt-2 opacity-50 shrink-0">
                <p className="text-[7px] text-text-muted tracking-widest uppercase">Generated by Grabbe Personal Media Engine v{packageJson.version}</p>
              </footer>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleExportStory}
            className="cursor-pointer bg-secondary text-on-secondary px-6 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 secondary-glow shadow-md shadow-secondary/20 select-none font-sans"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Download Recap Story (9:16)
          </button>
        </div>
      </div>
    </div>

    {/* Download Completion Bubble */}
    {showNotification && downloadedFile && (
      <div className="fixed bottom-6 right-6 z-50 bg-[#002b36]/95 backdrop-blur-md border border-primary/30 bloom-shadow rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-bottom-5 w-105 shadow-2xl shadow-black/60 font-sans">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-2xl animate-pulse">download_done</span>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">Image Exported</span>
            <button 
              onClick={() => setShowNotification(false)}
              className="text-text-muted hover:text-white transition-colors cursor-pointer flex items-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <span className="text-xs text-text-muted truncate font-mono mt-1">
            {downloadedFile}
          </span>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleShowInFolder}
              className="cursor-pointer bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 select-none"
            >
              <span className="material-symbols-outlined text-[14px]">folder_open</span>
              Show in Folder
            </button>
          </div>
        </div>
      </div>
    )}
  </section>
  );
};
