import { create } from 'zustand';
import { DiscoverResult } from '../components/discover/data';
import { MediaType } from '../components/shared/types';

interface DiscoverState {
  searchQuery: string;
  searchResults: DiscoverResult[];
  isSearching: boolean;
  hasSearched: boolean;
  activeType: MediaType;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: DiscoverResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  setActiveType: (type: MediaType) => void;
}

export const useDiscoverStore = create<DiscoverState>((set) => ({
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  hasSearched: false,
  activeType: 'ALL',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setHasSearched: (hasSearched) => set({ hasSearched }),
  setActiveType: (activeType) => set({ activeType }),
}));
