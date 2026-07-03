import React, { useState, useRef, useEffect } from 'react';
import { formatTotalHours } from '../../lib/timeMetrics';
import packageJson from '../../../package.json';
import { toPng } from 'html-to-image';
import { openPath } from '@tauri-apps/plugin-opener';
import { downloadDir } from '@tauri-apps/api/path';
import { apiFetch, API_BASE_URL } from '../../lib/httpClient';
import { useToast } from '../../contexts/ToastContext';

const Icon: React.FC<{ name: string; className?: string; style?: React.CSSProperties }> = ({ name, className, style }) => {
  switch (name) {
    case 'insights':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case 'trending_up':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case 'auto_awesome':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="currentColor">
          <path d="M9 4L11.5 9.5L17 12L11.5 14.5L9 20L6.5 14.5L1 12L6.5 9.5Z" />
          <path d="M19 1L20.25 3.75L23 5L20.25 6.25L19 9L17.75 6.25L15 5L17.75 3.75Z" />
          <path d="M19 15L19.75 16.75L21.5 17.5L19.75 18.25L19 20L18.25 18.25L16.5 17.5L18.25 16.75Z" />
        </svg>
      );
    case 'movie_filter':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      );
    case 'animation':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="12" height="12" rx="2" />
          <path d="M7 15h8a2 2 0 0 0 2-2V5" opacity="0.7" />
          <path d="M11 19h8a2 2 0 0 0 2-2V9" opacity="0.4" />
        </svg>
      );
    case 'calendar_month':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'heart_broken':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="currentColor">
          <path d="M12 5c-1.74-2.09-3.41-2.9-5.18-2.9C3.74 2.1 1 4.7 1 7.9c0 3.5 3.1 6.5 8.1 11.1l1.9 1.7V17l-2-2 2-3-2-2 3-2V5z" />
          <path d="M12 5v3l-3 2 2 2-2 3 2 2v2.7l1.9-1.7c5-4.6 8.1-7.6 8.1-11.1 0-3.2-2.7-5.8-5.8-5.8-1.77 0-3.44.81-4.2 2.9z" opacity="0.9"/>
        </svg>
      );
    case 'sentiment_very_dissatisfied':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
          <path d="M16 16c0-1.5-1.79-3-4-3s-4 1.5-4 3" />
        </svg>
      );
    case 'schedule':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'stars':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.89 15.55L12 15.28l-3.89 2.27 1.02-4.43-3.41-2.98 4.54-.39L12 5.5l1.74 4.28 4.54.39-3.41 2.98 1.02 4.43z" />
        </svg>
      );
    case 'format_quote':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      );
    case 'download':
      return (
        <svg viewBox="0 0 24 24" width="1em" height="1em" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    default:
      return null;
  }
};

const hexEncode = (str: string): string => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
};

const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  if (lower === '' || lower === 'null' || lower === 'undefined') return false;
  if (lower.includes('localhost:1420/profile') || lower.includes('tauri.localhost/profile') || lower.includes('tauri://localhost/profile')) {
    return false;
  }
  if (lower === '/profile' || lower === 'profile') return false;
  return true;
};

const getProxiedImageUrl = (url: string | null | undefined): string => {
  if (!isValidImageUrl(url)) return '';
  if (url!.startsWith('http')) {
    return `${API_BASE_URL}/api/v1/export/proxy/${hexEncode(url!)}`;
  }
  return url!;
};

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
  const { showToast } = useToast();
  const [previewType, setPreviewType] = useState<'desktop' | 'story'>('desktop');

  const parseExportError = (err: any): string => {
    if (err instanceof Event) {
      const target = err.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        let src = img.src;
        if (src.includes('/api/v1/export/proxy/')) {
          const parts = src.split('/api/v1/export/proxy/');
          const hexUrl = parts[parts.length - 1];
          try {
            let rawUrl = '';
            for (let i = 0; i < hexUrl.length; i += 2) {
              rawUrl += String.fromCharCode(parseInt(hexUrl.substring(i, i + 2), 16));
            }
            src = rawUrl;
          } catch (e) {}
        }
        return `Failed to load image: ${src}`;
      }
      return 'Image/resource loading failed during capture';
    }
    return err?.message || String(err);
  };
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
        skipFonts: true,
      });

      const response = await apiFetch('/api/v1/export/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          base64Data: dataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`BFF returned status ${response.status}`);
      }

      setDownloadedFile(fileName);
      setShowNotification(true);
    } catch (err: any) {
      console.error('Failed to export desktop banner:', err);
      showToast(`Export failed: ${parseExportError(err)}`, 'error');
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
        skipFonts: true,
      });

      const response = await apiFetch('/api/v1/export/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          base64Data: dataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`BFF returned status ${response.status}`);
      }

      setDownloadedFile(fileName);
      setShowNotification(true);
    } catch (err: any) {
      console.error('Failed to export story banner:', err);
      showToast(`Export failed: ${parseExportError(err)}`, 'error');
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
                    {userAvatar.startsWith('http') && isValidImageUrl(userAvatar) ? (
                      <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={getProxiedImageUrl(userAvatar)} crossOrigin="anonymous" />
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
                    <Icon name="insights" className="text-3xl" style={{ color: primaryColor }} />
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
                    <Icon name="auto_awesome" className="text-xl" style={{ color: secondaryColor }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                      Masterpiece of the Month
                    </span>
                  </div>
                  <div className="p-6 bg-[#002b36]/60 border border-white/5 rounded-2xl flex gap-6 items-center shadow-xl">
                    <div className="relative w-36 h-52 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-[#001b22] flex items-center justify-center">
                      {monthlyRecap.masterpiece?.cover_image_path && isValidImageUrl(monthlyRecap.masterpiece.cover_image_path) ? (
                        <img
                          alt="Masterpiece"
                          className="w-full h-full object-cover"
                          src={getProxiedImageUrl(monthlyRecap.masterpiece.cover_image_path)}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <Icon name="movie_filter" className="text-4xl text-white/20" />
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
                          <Icon name="animation" className="text-xs" style={{ color: secondaryColor }} />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-text-high">
                            {monthlyRecap.masterpiece?.type || 'N/A'}
                          </span>
                        </div>
                        {monthlyRecap.masterpiece?.release_year && (
                          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
                            <Icon name="calendar_month" className="text-xs" style={{ color: primaryColor }} />
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
                      {monthlyRecap.badMedia?.cover_image_path && isValidImageUrl(monthlyRecap.badMedia.cover_image_path) ? (
                        <img
                          alt="Bad Media"
                          className="w-full h-full object-cover grayscale opacity-60"
                          src={getProxiedImageUrl(monthlyRecap.badMedia.cover_image_path)}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <Icon name="heart_broken" className="text-2xl text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Icon name="sentiment_very_dissatisfied" className="text-[10px]" />
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
                    <Icon name="format_quote" className="absolute -top-4 -left-1 opacity-20 text-5xl" style={{ color: primaryColor }} />
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
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Total Consumido</span>
                    <span className="text-lg font-bold mt-0.5" style={{ color: primaryColor }}>
                      {formatTotalHours(monthlyRecap.minutes)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Monthly Media</span>
                    <span className="text-lg font-bold mt-0.5" style={{ color: secondaryColor }}>
                      {monthlyRecap.completedCount}
                    </span>
                  </div>
                  <div className="flex flex-col pl-2">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Top Genres</span>
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
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
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
                    {userAvatar.startsWith('http') && isValidImageUrl(userAvatar) ? (
                      <img alt="Avatar" className="w-full h-full object-cover rounded-full" src={getProxiedImageUrl(userAvatar)} crossOrigin="anonymous" />
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
                      {monthlyRecap.masterpiece?.cover_image_path && isValidImageUrl(monthlyRecap.masterpiece.cover_image_path) ? (
                        <img
                          alt="Masterpiece"
                          className="w-full h-full object-cover"
                          src={getProxiedImageUrl(monthlyRecap.masterpiece.cover_image_path)}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <Icon name="movie_filter" className="text-2xl text-white/20" />
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
                        <Icon name="stars" className="text-xs" style={{ color: secondaryColor }} />
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
                      {monthlyRecap.badMedia.cover_image_path && isValidImageUrl(monthlyRecap.badMedia.cover_image_path) ? (
                        <img
                          alt="Bad Media"
                          className="w-full h-full object-cover grayscale opacity-60"
                          src={getProxiedImageUrl(monthlyRecap.badMedia.cover_image_path)}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <Icon name="heart_broken" className="text-lg text-white/20" />
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
                  <Icon name="trending_up" className="text-lg" style={{ color: secondaryColor }} />
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-text-muted font-bold whitespace-nowrap">Monthly Media</p>
                    <p className="text-sm font-bold text-white mt-0.5">{monthlyRecap.completedCount}</p>
                  </div>
                </div>

                <div
                  className="bg-[#002b36]/60 border border-white/5 rounded-xl flex flex-col justify-between h-20 p-2.5 shadow border-t-2"
                  style={{ borderTopColor: primaryColor }}
                >
                  <Icon name="schedule" className="text-lg" style={{ color: primaryColor }} />
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-text-muted font-bold whitespace-nowrap">Total Consumed</p>
                    <p className="text-sm font-bold text-white mt-0.5">{formatTotalHours(monthlyRecap.minutes)}</p>
                  </div>
                </div>

                <div
                  className="bg-[#002b36]/60 border border-white/5 rounded-xl flex flex-col justify-between p-3 col-span-2 shadow border-t-2 gap-2 min-h-[90px]"
                  style={{ borderTopColor: tertiaryColor }}
                >
                  <div className="flex justify-between items-start">
                    <Icon name="insights" className="text-lg" style={{ color: tertiaryColor }} />
                    <span className="text-[8px] uppercase tracking-wider text-text-muted font-bold whitespace-nowrap">Monthly Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1 text-left">
                    {/* Left: Top Obras */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Top Media</span>
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
                      <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Top Genres</span>
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
