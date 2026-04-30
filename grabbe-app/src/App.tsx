import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        {/* Futuras rotas podem ser adicionadas aqui */}
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
