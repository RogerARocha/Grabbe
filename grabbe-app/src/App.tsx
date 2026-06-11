import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigationHistory } from './store/navigationHistory';
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
      const name = await getSetting('USER_NAME');
      const skipKeys = await getSetting('SKIP_KEYS');
      const tmdb = await getSetting('TMDB_API_KEY');
      const client = await getSetting('IGDB_CLIENT_ID');
      const secret = await getSetting('IGDB_CLIENT_SECRET');
      
      if (!name) {
        setNeedsOnboarding(true);
      } else if (skipKeys === 'true') {
        setNeedsOnboarding(false);
      } else if (!tmdb || !client || !secret) {
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
function NavigationTracker() {
  const location = useLocation();
  const navType = useNavigationType();
  const { historyStack, currentIndex, pushPath, setIndexForPath } = useNavigationHistory();

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    if (navType === 'POP') {
      const index = historyStack.indexOf(fullPath);
      if (index !== -1) {
        setIndexForPath(index);
      } else {
        pushPath(fullPath);
      }
    } else if (navType === 'PUSH') {
      pushPath(fullPath);
    } else if (navType === 'REPLACE') {
      const newStack = [...historyStack];
      if (currentIndex >= 0 && currentIndex < newStack.length) {
        newStack[currentIndex] = fullPath;
        useNavigationHistory.setState({ historyStack: newStack });
      } else {
        pushPath(fullPath);
      }
    }
  }, [location, navType]);

  return null;
}

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
          <NavigationTracker />
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

