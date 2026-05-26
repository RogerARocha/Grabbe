import { create } from 'zustand';
import { DiscoverResult } from '../components/discover/data';
import { MediaType } from '../components/shared/types';

interface DiscoverState {
  searchQuery: string;
  searchResults: DiscoverResult[];
  isSearching: boolean;
  hasSearched: boolean;
  activeType: MediaType;
  currentPage: number;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: DiscoverResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  setActiveType: (type: MediaType) => void;
  setCurrentPage: (page: number) => void;
}

export const useDiscoverStore = create<DiscoverState>((set) => ({
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  hasSearched: false,
  activeType: 'ALL',
  currentPage: 1,
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSearchResults: (searchResults) => set({ searchResults, currentPage: 1 }),
  setIsSearching: (isSearching) => set(isSearching ? { isSearching, currentPage: 1 } : { isSearching }),
  setHasSearched: (hasSearched) => set({ hasSearched }),
  setActiveType: (activeType) => set({ activeType, currentPage: 1 }),
  setCurrentPage: (currentPage) => set({ currentPage }),
}));
