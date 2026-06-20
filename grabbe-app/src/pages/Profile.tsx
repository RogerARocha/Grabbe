import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { getSetting, setSetting, getLibraryItems, getConsumptionSessions } from '../lib/db';
import { ProfileSelectionModal } from '../components/modals/ProfileSelectionModal';
import { useToast } from '../contexts/ToastContext';
import { calculateInvestedMinutes } from '../lib/timeMetrics';

// Sub-components
import { CardIdentityForm } from '../components/profile/CardIdentityForm';
import { ProfileCardPreview } from '../components/profile/ProfileCardPreview';

interface PinnedMedia {
  id: string;
  title: string;
  cover_image_path: string | null;
  score: number | null;
  type: string;
}

const GRADIENT_THEMES = [
  { id: 'cyberpunk', name: 'Cyberpunk Neon', colors: ['#f848a1', '#00a3f5'], css: 'from-[#f848a1] to-[#00a3f5]' },
  { id: 'aurora', name: 'Aurora Glow', colors: ['#53EAAA', '#00A3F5'], css: 'from-[#53EAAA] to-[#00A3F5]' },
  { id: 'cosmic', name: 'Cosmic Violet', colors: ['#F848A1', '#7928ca'], css: 'from-[#F848A1] to-[#7928ca]' },
  { id: 'sunset', name: 'Sunset Amber', colors: ['#FEA800', '#F848A1'], css: 'from-[#FEA800] to-[#F848A1]' },
  { id: 'oceanic', name: 'Deep Oceanic', colors: ['#00A3F5', '#00212b'], css: 'from-[#00A3F5] to-[#00212b]' },
  { id: 'solarized', name: 'Solarized Gold', colors: ['#b58900', '#2aa198'], css: 'from-[#b58900] to-[#2aa198]' }
];

const PRESET_EMOJIS = ['🍿', '🎮', '📚', '🎬', '👾', '🎧', '🖌️', '☕', '👽', '🦊', '🐉', '🚀', '🧙‍♂️', '🎸', '🍕', '🐱'];

export const Profile = () => {
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [userBio, setUserBio] = useState('');
  const [userAvatar, setUserAvatar] = useState('👾');
  const [userTheme, setUserTheme] = useState('cyberpunk');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [pinnedItems, setPinnedItems] = useState<(PinnedMedia | null)[]>([null, null, null, null, null]);
  const [items, setItems] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // Selection Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // Monthly Recap state
  const currentDate = new Date();
  const [recapYear, setRecapYear] = useState(currentDate.getFullYear());
  const [recapMonth, setRecapMonth] = useState(currentDate.getMonth()); // 0-indexed
  const [recapHighlight, setRecapHighlight] = useState('');

  // Load profile settings and library data
  useEffect(() => {
    async function loadProfile() {
      const nameSetting = await getSetting('USER_NAME');
      const bioSetting = await getSetting('USER_BIO');
      const avatarSetting = await getSetting('USER_AVATAR');
      const themeSetting = await getSetting('USER_THEME');
      const pinnedSetting = await getSetting('USER_PINNED_MEDIA');
      const recapHighlightSetting = await getSetting('USER_RECAP_HIGHLIGHT');
      const recapMonthSetting = await getSetting('USER_RECAP_MONTH');
      const recapYearSetting = await getSetting('USER_RECAP_YEAR');

      if (nameSetting) setUserName(nameSetting);
      if (bioSetting) setUserBio(bioSetting);
      if (avatarSetting) setUserAvatar(avatarSetting);
      if (themeSetting) setUserTheme(themeSetting);
      if (recapHighlightSetting) setRecapHighlight(recapHighlightSetting);
      if (recapMonthSetting) setRecapMonth(parseInt(recapMonthSetting));
      if (recapYearSetting) setRecapYear(parseInt(recapYearSetting));

      let loadedPinnedIds: string[] = [];
      if (pinnedSetting) {
        try {
          loadedPinnedIds = JSON.parse(pinnedSetting);
          setPinnedIds(loadedPinnedIds);
        } catch (e) {
          console.error('Failed to parse pinned media settings:', e);
        }
      }

      // Fetch library items to map pinned items
      const libItems = await getLibraryItems();
      if (libItems) {
        setItems(libItems);

        // Map pinned items
        const newPinned: (PinnedMedia | null)[] = [null, null, null, null, null];
        loadedPinnedIds.forEach((id, idx) => {
          if (idx < 5) {
            const found = libItems.find((i) => i.id === id);
            if (found) {
              newPinned[idx] = {
                id: found.id,
                title: found.title,
                cover_image_path: found.cover_image_path,
                score: found.score,
                type: found.type,
              };
            }
          }
        });
        setPinnedItems(newPinned);
      }

      // Fetch sessions for monthly recap
      const rawSessions = await getConsumptionSessions();
      if (rawSessions) {
        setSessions(rawSessions);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await setSetting('USER_NAME', userName.trim());
      await setSetting('USER_BIO', userBio.trim());
      await setSetting('USER_AVATAR', userAvatar);
      await setSetting('USER_THEME', userTheme);
      
      const pinnedToSave = pinnedItems.filter(i => i !== null).map(i => i!.id);
      await setSetting('USER_PINNED_MEDIA', JSON.stringify(pinnedToSave));

      await setSetting('USER_RECAP_HIGHLIGHT', recapHighlight.trim());
      await setSetting('USER_RECAP_MONTH', String(recapMonth));
      await setSetting('USER_RECAP_YEAR', String(recapYear));

      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to save profile settings:', err);
      showToast('Error saving profile settings.', 'error');
    }
  };

  /*
  const handleOpenPinModal = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex);
    setIsModalOpen(true);
  };
  */

  const handleSelectMedia = (media: any) => {
    if (activeSlotIndex === null) return;

    const newPinnedItems = [...pinnedItems];
    newPinnedItems[activeSlotIndex] = {
      id: media.id,
      title: media.title,
      cover_image_path: media.cover_image_path,
      score: media.score,
      type: media.type
    };

    setPinnedItems(newPinnedItems);
    setPinnedIds(newPinnedItems.filter(i => i !== null).map(i => i!.id));
    setIsModalOpen(false);
    setActiveSlotIndex(null);
  };

  /*
  const handleUnpinMedia = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinnedItems = [...pinnedItems];
    newPinnedItems[slotIndex] = null;
    setPinnedItems(newPinnedItems);
    setPinnedIds(newPinnedItems.filter(i => i !== null).map(i => i!.id));
  };
  */

  // Helper to parse dates safely
  const parseSafeDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(val);
    const str = String(val || '');
    return new Date(str.includes(' ') ? str.replace(' ', 'T') + 'Z' : str);
  };



  // Monthly Recap calculation helpers
  const getMonthlyRecapData = () => {
    // 1. Filter sessions finished in the selected month
    const monthlySessions = sessions.filter((s) => {
      const finishDate = parseSafeDate(s.finish_date);
      if (!finishDate) return false;
      return finishDate.getFullYear() === recapYear && finishDate.getMonth() === recapMonth;
    });

    // Calculate total minutes invested this month
    const monthlyMinutes = monthlySessions.reduce((acc, s) => {
      const prog = (s.type === 'GAME' && (s.status === 'COMPLETED' || s.status === 'DROPPED')) || 
                   (s.type === 'MOVIE' && s.status === 'COMPLETED') ? 1 : (s.progress || 0);
      return acc + calculateInvestedMinutes(s.type, s.consumption_metric, prog);
    }, 0);

    // 2. Filter library items finished in selected month.
    // Some items (imported anime, games) may not have a ConsumptionSession finish_date
    // recorded even when status=COMPLETED. Fall back to updated_at as the completion date.
    const monthlyFinishedItems = items.filter((item) => {
      if (item.status !== 'COMPLETED') return false;
      const finishDate = parseSafeDate(item.finish_date) || parseSafeDate(item.updated_at);
      if (!finishDate) return false;
      return (
        finishDate.getFullYear() === recapYear &&
        finishDate.getMonth() === recapMonth
      );
    });

    // Calculate average rating for monthly finished items
    const ratedItems = monthlyFinishedItems.filter((i) => i.score !== null && i.score > 0);
    const averageRating =
      ratedItems.length > 0
        ? (ratedItems.reduce((acc, i) => acc + i.score, 0) / ratedItems.length).toFixed(1)
        : '0.0';

    // 3. "Trinity of the Month" (Top 3 rated items finished this month)
    const trinity = [...monthlyFinishedItems]
      .sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, 3);

    // 4. Masterpiece of the Month
    const masterpiece = ratedItems.length > 0
      ? [...ratedItems].sort((a, b) => (b.score || 0) - (a.score || 0))[0]
      : (monthlyFinishedItems.length > 0 ? monthlyFinishedItems[0] : null);

    // 5. Bad Media of the Month
    const sortedByScoreAsc = [...ratedItems].sort((a, b) => (a.score || 0) - (b.score || 0));
    const badMedia = (sortedByScoreAsc.length > 1 || (sortedByScoreAsc.length === 1 && (sortedByScoreAsc[0].score || 0) <= 6))
      ? sortedByScoreAsc[0]
      : null;

    // 6. Top Genre calculation
    const genreCounts: { [key: string]: number } = {};
    monthlyFinishedItems.forEach(item => {
      let itemGenres: string[] = [];
      if (item.genres) {
        try {
          itemGenres = typeof item.genres === 'string' ? JSON.parse(item.genres) : item.genres;
        } catch (e) {}
      }
      if (Array.isArray(itemGenres)) {
        itemGenres.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    let topGenre = '';
    let topGenreCount = 0;
    Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > topGenreCount) {
        topGenre = genre;
        topGenreCount = count;
      }
    });

    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    let genreHighlight: any = null;
    if (topGenre) {
      const genreItems = monthlyFinishedItems.filter(item => {
        let itemGenres: string[] = [];
        if (item.genres) {
          try {
            itemGenres = typeof item.genres === 'string' ? JSON.parse(item.genres) : item.genres;
          } catch (e) {}
        }
        return Array.isArray(itemGenres) && itemGenres.includes(topGenre);
      });
      genreHighlight = genreItems.sort((a, b) => (b.score || 0) - (a.score || 0))[0] || null;
    }

    // 7. Auto Narrative Phrase
    let autoPhrase = '';
    if (topGenre) {
      const gLower = topGenre.toLowerCase();
      if (gLower.includes('romance')) {
        autoPhrase = `Cupid is in the air, you completed ${topGenreCount} romances`;
      } else if (gLower.includes('action') || gLower.includes('ação') || gLower.includes('adventure') || gLower.includes('aventura')) {
        autoPhrase = `Pure adrenaline, you completed ${topGenreCount} adventures`;
      } else if (gLower.includes('comedy') || gLower.includes('comédia')) {
        autoPhrase = `Lots of laughs, you completed ${topGenreCount} comedies`;
      } else if (gLower.includes('drama')) {
        autoPhrase = `Prepare the tissues, you completed ${topGenreCount} dramas`;
      } else if (gLower.includes('sci-fi') || gLower.includes('ficção')) {
        autoPhrase = `Future travel, you completed ${topGenreCount} sci-fi items`;
      } else if (gLower.includes('horror') || gLower.includes('terror')) {
        autoPhrase = `Sleepless nights, you completed ${topGenreCount} horror items`;
      } else {
        autoPhrase = `Total focus, you completed ${topGenreCount} ${topGenre} items`;
      }
    } else {
      autoPhrase = `Exploring new horizons, you completed ${monthlyFinishedItems.length} media items`;
    }

    const highlightPhrase = recapHighlight.trim() ? recapHighlight : autoPhrase;

    return {
      minutes: monthlyMinutes,
      completedCount: monthlyFinishedItems.length,
      averageRating,
      trinity,
      masterpiece,
      badMedia,
      topGenre,
      topGenres,
      genreHighlight,
      autoHighlightPhrase: autoPhrase,
      highlightPhrase,
    };
  };

  const monthlyRecap = getMonthlyRecapData();
  const selectedTheme = GRADIENT_THEMES.find((t) => t.id === userTheme) || GRADIENT_THEMES[0];

  const yearsRange = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-high mb-2">Profile & Identity</h1>
          <p className="text-text-muted">Personalize your public-facing library card and compile monthly consumption wraps.</p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Card Identity Configuration Panel */}
          <div className="w-full">
            <CardIdentityForm
              userName={userName}
              setUserName={setUserName}
              userAvatar={userAvatar}
              setUserAvatar={setUserAvatar}
              userTheme={userTheme}
              setUserTheme={setUserTheme}
              onSave={handleSaveProfile}
              presetEmojis={PRESET_EMOJIS}
              gradientThemes={GRADIENT_THEMES}
              recapMonth={recapMonth}
              setRecapMonth={setRecapMonth}
              recapYear={recapYear}
              setRecapYear={setRecapYear}
              recapHighlight={recapHighlight}
              setRecapHighlight={setRecapHighlight}
              monthsList={monthsList}
              yearsRange={yearsRange}
              autoHighlightPhrase={monthlyRecap.autoHighlightPhrase}
            />
          </div>

          {/* Previews and Exports */}
          <div className="w-full">
            <ProfileCardPreview
              userName={userName}
              userAvatar={userAvatar}
              selectedTheme={selectedTheme}
              recapMonth={recapMonth}
              recapYear={recapYear}
              monthlyRecap={monthlyRecap}
              monthsList={monthsList}
            />
          </div>
        </div>
      </div>

      <ProfileSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectMedia}
        alreadyPinnedIds={pinnedIds}
      />
    </MainLayout>
  );
};
