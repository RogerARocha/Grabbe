import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSetting } from '../lib/db';
import { apiFetch } from '../lib/httpClient';
import { useToast } from '../contexts/ToastContext';
import { TopBar } from '../components/layout/TopBar';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Step state
  const [step, setStep] = useState(1);
  
  // Form state
  const [name, setName] = useState('');
  const [tmdbKey, setTmdbKey] = useState('');
  const [igdbClientId, setIgdbClientId] = useState('');
  const [igdbClientSecret, setIgdbClientSecret] = useState('');
  
  // Loading & error state
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNextStep = () => {
    if (!name.trim()) {
      showToast('Please enter your name to continue.', 'error');
      return;
    }
    setStep(2);
  };

  const handleBackStep = () => {
    setStep(1);
    setValidationError(null);
  };

  const handleComplete = async () => {
    if (!tmdbKey.trim()) {
      showToast('TMDB API Key is required.', 'error');
      return;
    }
    if (!igdbClientId.trim() || !igdbClientSecret.trim()) {
      showToast('Twitch/IGDB Client ID and Secret are required.', 'error');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await apiFetch('/api/v1/credentials/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbApiKey: tmdbKey.trim(),
          igdbClientId: igdbClientId.trim(),
          igdbClientSecret: igdbClientSecret.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save to SQLite AppSettings
        await setSetting('USER_NAME', name.trim());
        await setSetting('TMDB_API_KEY', tmdbKey.trim());
        await setSetting('IGDB_CLIENT_ID', igdbClientId.trim());
        await setSetting('IGDB_CLIENT_SECRET', igdbClientSecret.trim());

        showToast(`Welcome aboard, ${name}! Your keys have been verified.`, 'success');
        
        // Force routing to /discover for first entry
        navigate('/discover', { replace: true });
        
        // Reload to let any interceptors know settings are set
        window.location.reload();
      } else {
        let errorMsg = 'Key validation failed. Please check your inputs.';
        if (data.tmdbValid === false && data.twitchValid === false) {
          errorMsg = 'Both TMDB Key and Twitch ID/Secret are invalid.';
        } else if (data.tmdbValid === false) {
          errorMsg = `TMDB Key validation failed. ${data.tmdbError || ''}`;
        } else if (data.twitchValid === false) {
          errorMsg = `Twitch ID/Secret validation failed. ${data.twitchError || ''}`;
        } else if (data.error) {
          errorMsg = data.error;
        }
        setValidationError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      const msg = 'Failed to connect to backend for validation. Make sure backend is running.';
      setValidationError(msg);
      showToast(msg, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-high flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <TopBar minimal={true} />
      
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-xl bg-surface border border-white/5 rounded-3xl shadow-2xl shadow-black/50 p-8 md:p-10 backdrop-blur-md glass-panel z-10 transition-all duration-500">
        
        {/* Header section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/10 p-2.5">
            <img src="/app-icon.png" alt="Grabbe Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome to <span className="prismatic-text">Grabbe</span>
          </h1>
          <p className="text-text-muted mt-2 text-sm max-w-sm">
            Set up your profile and credentials to connect to global media databases.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-primary' : 'w-2 bg-white/10'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-primary' : 'w-2 bg-white/10'}`} />
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
              <label htmlFor="name-input" className="text-xs font-bold uppercase tracking-wider text-text-muted">What should we call you?</label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-background border border-outline-variant/10 rounded-xl text-base px-5 py-3.5 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/50"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
              />
            </div>
            
            <button
              onClick={handleNextStep}
              className="cursor-pointer w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 primary-glow shadow-md shadow-primary/20 select-none"
            >
              Continue
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Step 2: Keys */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {validationError && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-error text-xs leading-relaxed flex gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* TMDB API Key */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="tmdb-key-input" className="text-xs font-bold uppercase tracking-wider text-text-muted">TMDB API Key (Bearer Token)</label>
                  <a 
                    href="https://www.themoviedb.org/documentation/api" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">help</span>
                    How to get it
                  </a>
                </div>
                <input
                  id="tmdb-key-input"
                  type="password"
                  value={tmdbKey}
                  onChange={(e) => setTmdbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm px-5 py-3 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/30"
                />
              </div>

              {/* Twitch/IGDB Client ID */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="twitch-id-input" className="text-xs font-bold uppercase tracking-wider text-text-muted">Twitch/IGDB Client ID</label>
                  <a 
                    href="https://api-docs.igdb.com/#getting-started" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">help</span>
                    How to get it
                  </a>
                </div>
                <input
                  id="twitch-id-input"
                  type="text"
                  value={igdbClientId}
                  onChange={(e) => setIgdbClientId(e.target.value)}
                  placeholder="Enter Client ID..."
                  className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm px-5 py-3 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/30"
                />
              </div>

              {/* Twitch/IGDB Client Secret */}
              <div className="flex flex-col gap-2">
                <label htmlFor="twitch-secret-input" className="text-xs font-bold uppercase tracking-wider text-text-muted">Twitch/IGDB Client Secret</label>
                <input
                  id="twitch-secret-input"
                  type="password"
                  value={igdbClientSecret}
                  onChange={(e) => setIgdbClientSecret(e.target.value)}
                  placeholder="Enter Client Secret..."
                  className="w-full bg-background border border-outline-variant/10 rounded-xl text-sm px-5 py-3 text-text-high outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/30"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBackStep}
                disabled={isValidating}
                className="cursor-pointer flex-1 bg-surface-container hover:bg-surface-container/80 border border-outline-variant/20 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 select-none disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>

              <button
                onClick={handleComplete}
                disabled={isValidating}
                className="cursor-pointer flex-2 bg-primary text-on-primary py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 primary-glow shadow-md shadow-primary/20 select-none disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                    Validating Keys...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    Verify & Complete
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
