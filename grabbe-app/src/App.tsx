import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { MediaDetails } from './pages/MediaDetails';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/media/:id" element={<MediaDetails />} />
        {/* <Route path="/movies" element={<Movies />} /> */}
        {/* <Route path="/series" element={<Series />} /> */}
        {/* <Route path="/anime" element={<Anime />} /> */}
        {/* <Route path="/games" element={<Games />} /> */}
        {/* <Route path="/books" element={<Books />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
