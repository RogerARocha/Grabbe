import React from 'react';

interface CardIdentityFormProps {
  userName: string;
  setUserName: (val: string) => void;
  userAvatar: string;
  setUserAvatar: (val: string) => void;
  userTheme: string;
  setUserTheme: (val: string) => void;
  onSave: () => void;
  presetEmojis: string[];
  gradientThemes: { id: string; name: string; colors: string[]; css: string }[];
  
  recapMonth: number;
  setRecapMonth: (val: number) => void;
  recapYear: number;
  setRecapYear: (val: number) => void;
  recapHighlight: string;
  setRecapHighlight: (val: string) => void;
  monthsList: string[];
  yearsRange: number[];
  autoHighlightPhrase: string;
}

export const CardIdentityForm: React.FC<CardIdentityFormProps> = ({
  userName,
  setUserName,
  userAvatar,
  setUserAvatar,
  userTheme,
  setUserTheme,
  onSave,
  presetEmojis,
  gradientThemes,
  recapMonth,
  setRecapMonth,
  recapYear,
  setRecapYear,
  recapHighlight,
  setRecapHighlight,
  monthsList,
  yearsRange,
  autoHighlightPhrase,
}) => {
  return (
    <section className="bg-surface p-6 rounded-2xl border border-white/5 space-y-6 shadow-lg shadow-black/20 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-high flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">edit</span>
        Card Identity
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Username */}
        <div className="flex flex-col gap-4">
          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted font-sans">Username</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter public name..."
              className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm px-4 py-2.5 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-sans"
            />
          </div>
          {/* TODO: Restore Biography and Hall of Fame when we create the online profile */}
        </div>

        {/* Right Column: Avatar & Theme */}
        <div className="flex flex-col gap-4">
          {/* Avatar Emojis */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted font-sans">Select Avatar Emoji</label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-background/50 border border-outline-variant/5 rounded-xl">
              {presetEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setUserAvatar(emoji)}
                  className={`text-2xl p-1 rounded-lg transition-all hover:bg-white/5 active:scale-90 select-none cursor-pointer ${
                    userAvatar === emoji ? 'bg-primary/20 ring-1 ring-primary' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
                <input
                  type="text"
                  maxLength={2}
                  value={userAvatar}
                  onChange={(e) => setUserAvatar(e.target.value)}
                  placeholder="Custom"
                  className="w-12 bg-background border border-outline-variant/10 rounded text-center text-xs py-1 text-text-high outline-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Card Theme Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted font-sans">Choose Card Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gradientThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setUserTheme(theme.id)}
                  className={`flex items-center justify-between p-2 py-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                    userTheme === theme.id
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-white/5 bg-background/40 hover:bg-background/80 hover:border-outline-variant/20'
                  }`}
                >
                  <span className="text-xs font-bold text-text-high font-sans">{theme.name}</span>
                  <div className={`w-3.5 h-3.5 rounded-full bg-linear-to-r ${theme.css}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Monthly Recap Settings */}
      <div className="pt-4 border-t border-white/5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-high flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">calendar_month</span>
            Monthly Recap Settings
          </h3>
          <p className="text-xs text-text-muted mt-1">Configure the month, year, highlight quote, and mood for your monthly wrap card.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Month & Year Selectors */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted font-sans">Recap Month</label>
            <select
              value={recapMonth}
              onChange={(e) => setRecapMonth(parseInt(e.target.value))}
              className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm px-4 py-2 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-sans"
            >
              {monthsList.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted font-sans">Recap Year</label>
            <select
              value={recapYear}
              onChange={(e) => setRecapYear(parseInt(e.target.value))}
              className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm px-4 py-2 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-sans"
            >
              {yearsRange.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Highlight Phrase */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted font-sans">Destaque Narrative Quote (Override)</label>
            <input
              type="text"
              value={recapHighlight}
              onChange={(e) => setRecapHighlight(e.target.value)}
              placeholder={`Default: "${autoHighlightPhrase}"`}
              className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm px-4 py-2.5 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-sans"
            />
            <p className="text-[10px] text-text-muted leading-normal">
              Leave this blank to automatically generate a phrase based on your top-watched category/genre.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          className="cursor-pointer bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 primary-glow shadow-md shadow-primary/20 select-none font-sans"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          Save Settings
        </button>
      </div>
    </section>
  );
};
