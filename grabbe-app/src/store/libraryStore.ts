import { create } from 'zustand';
import { MediaType, MediaStatus } from '../components/shared/types';

interface LibraryState {
  activeTab: MediaType;
  activeStatus: MediaStatus | 'ALL';
  searchQuery: string;
  sortBy: string;
  setActiveTab: (tab: MediaType) => void;
  setActiveStatus: (status: MediaStatus | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  activeTab: 'ALL',
  activeStatus: 'ALL',
  searchQuery: '',
  sortBy: 'last_added',
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveStatus: (activeStatus) => set({ activeStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
