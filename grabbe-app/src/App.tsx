import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { MediaDetails } from './pages/MediaDetails';
import './App.css';
import { ComingSoon } from './pages/ComingSoon';
import { Discover } from './pages/Discover';
import { initDb } from './lib/db';

function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDb().then(() => setDbReady(true)).catch(console.error);
  }, []);

  if (!dbReady) return <div className="flex items-center justify-center min-h-screen text-text-high">Loading Database...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/media/:id" element={<MediaDetails />} />
        <Route path="/discover" element={<Discover />} />

        {/* Telas que estão em desenvolvimento (Coming Soon) */}
        <Route path="/analytics" element={<ComingSoon feature="analytics" />} />
        <Route path="/community" element={<ComingSoon feature="community" />} />
        <Route path="/settings" element={<ComingSoon feature="settings" />} />
        <Route path="/profile" element={<ComingSoon feature="profile" />} />
        
        {/* Categorias específicas */}
        <Route path="/movies" element={<ComingSoon feature="movies" />} />
        <Route path="/series" element={<ComingSoon feature="series" />} />
        <Route path="/anime" element={<ComingSoon feature="anime" />} />
        <Route path="/games" element={<ComingSoon feature="games" />} />
        <Route path="/books" element={<ComingSoon feature="books" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
