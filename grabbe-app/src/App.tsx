import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { Ranking } from './pages/Ranking';
import { MediaDetails } from './pages/MediaDetails';
import './App.css';
import { ComingSoon } from './pages/ComingSoon';
import { Discover } from './pages/Discover';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import { initDb, getSetting } from './lib/db';
import { ImportProvider } from './contexts/ImportContext';
import { ToastProvider } from './contexts/ToastContext';
import { Onboarding } from './pages/Onboarding';

function OnboardingInterceptor() {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function checkCredentials() {
      const tmdb = await getSetting('TMDB_API_KEY');
      const client = await getSetting('IGDB_CLIENT_ID');
      const secret = await getSetting('IGDB_CLIENT_SECRET');
      if (!tmdb || !client || !secret) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
      setLoading(false);
    }
    checkCredentials();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text-high bg-background font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

/**
 * Main application entry point.
 * Initializes the local database and configures the routing for all main views.
 */
function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDb().then(() => setDbReady(true)).catch(console.error);
  }, []);

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text-high bg-background font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-text-muted">Loading Database...</p>
        </div>
      </div>
    );
  }

  return (
    <ImportProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Routes */}
            <Route element={<OnboardingInterceptor />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/media/:id" element={<MediaDetails />} />
              <Route path="/discover" element={<Discover />} />

              {/* Views currently in development (Coming Soon) */}
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/community" element={<ComingSoon feature="community" />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<ComingSoon feature="profile" />} />
              
              {/* Specific categories */}
              <Route path="/movies" element={<ComingSoon feature="movies" />} />
              <Route path="/series" element={<ComingSoon feature="series" />} />
              <Route path="/anime" element={<ComingSoon feature="anime" />} />
              <Route path="/games" element={<ComingSoon feature="games" />} />
              <Route path="/books" element={<ComingSoon feature="books" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ImportProvider>
  );
}

export default App;

