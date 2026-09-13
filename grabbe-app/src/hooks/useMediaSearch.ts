import { useState, useRef, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/httpClient';

export function useMediaSearch(initialMediaType: string = 'ALL') {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchType, setSearchType] = useState<string>(initialMediaType);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string, type?: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const activeType = type !== undefined ? type : searchType;
      const typeParam = activeType && activeType !== 'ALL' ? `&type=${encodeURIComponent(activeType)}` : '';
      const response = await apiFetch(`/api/v1/search?query=${encodeURIComponent(q)}${typeParam}&page=1`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Failed to search:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchType]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val, searchType), 400);
  };

  const handleTypeChange = (newType: string) => {
    setSearchType(newType);
    if (searchQuery.trim()) {
      runSearch(searchQuery, newType);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    showDropdown,
    setShowDropdown,
    searchType,
    setSearchType,
    handleTypeChange,
    handleQueryChange,
    clearSearch,
    runSearch
  };
}
