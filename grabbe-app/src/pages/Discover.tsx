import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { MediaType, MediaCard } from '../components/shared/MediaCard';
import { TYPE_FILTERS } from '../components/shared/types';
import { MOCK_RESULTS, DiscoverResult } from '../components/discover/data';
import { SkeletonCard, EmptyState, IdleState } from '../components/discover/DiscorverStates';

export const Discover = () => {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<MediaType>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<DiscoverResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = (q: string, type: MediaType) => {
    if (!q.trim()) {
      setHasSearched(false);
      setResults([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    setTimeout(() => {
      const filtered = MOCK_RESULTS.filter((r) => {
        const matchesQuery = r.title.toLowerCase().includes(q.toLowerCase());
        const matchesType = type === 'ALL' || r.type === type;
        return matchesQuery && matchesType;
      });
      setResults(filtered);
      setIsLoading(false);
    }, 600);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val, activeType), 400);
  };

  const handleTypeChange = (type: MediaType) => {
    setActiveType(type);
    if (query.trim()) runSearch(query, type);
  };

  return (
    <MainLayout>
      <div className="mb-10">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">
          Discover
        </p>
        <h1 className="text-5xl font-black tracking-tighter text-text-high">
          Discover <span className="prismatic-text">Everything</span>
        </h1>
      </div>

      <div className="relative mb-8 group">
        <div className="flex items-center bg-surface rounded-xl px-5 py-4 gap-4 border border-outline-variant/20 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 bloom-shadow">
          <span className="material-symbols-outlined text-text-muted text-2xl shrink-0 group-focus-within:text-primary">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Discover a title..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-text-high placeholder:text-text-muted font-medium"
          />
          {isLoading && <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin shrink-0" />}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-10 flex-wrap">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleTypeChange(filter.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${
              activeType === filter.value
                ? 'bg-primary text-on-primary primary-glow'
                : 'bg-surface text-text-muted hover:bg-surface-container hover:text-text-high border border-outline-variant/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {!hasSearched && !isLoading && <IdleState />}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && hasSearched && results.length === 0 && <EmptyState query={query} />}

      {!isLoading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
              {results.length} result{results.length !== 1 ? 's' : ''} for <span className="text-primary ml-1">"{query}"</span>
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((result) => {
    // Montando o subtítulo com os metadados disponíveis
    const subtitleParts = [];
    if (result.releaseDate) subtitleParts.push(result.releaseDate);
    if (result.formattedConsumptionMetric) subtitleParts.push(result.formattedConsumptionMetric);
    const subtitle = subtitleParts.join(' • ');

    return (
      <MediaCard 
        key={result.id}
        variant="discover"
        title={result.title}
        subtitle={subtitle}
        image={result.coverImageUrl}
        typeBadge={result.type}
        onClick={() => navigate(`/media/${result.id}`)}
        onAddClick={() => {
          //Modal de adicionar aqui
          console.log('Adicionando ao banco local SQLite:', result.title);
          // Aqui entrará a lógica de invocar o Tauri para salvar na library
        }}
      />
    );
  })}
          </div>
        </>
      )}
    </MainLayout>
  );
};