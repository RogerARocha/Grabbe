import { create } from 'zustand';
import { MediaType, MediaStatus } from '../components/shared/types';

interface LibraryState {
  activeTab: MediaType;
  activeStatus: MediaStatus | 'ALL';
  searchQuery: string;
  sortBy: string;
  currentPage: number;
  setActiveTab: (tab: MediaType) => void;
  setActiveStatus: (status: MediaStatus | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  setCurrentPage: (page: number) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  activeTab: 'ALL',
  activeStatus: 'ALL',
  searchQuery: '',
  sortBy: 'last_added',
  currentPage: 1,
  setActiveTab: (activeTab) => set({ activeTab, currentPage: 1 }),
  setActiveStatus: (activeStatus) => set({ activeStatus, currentPage: 1 }),
  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setSortBy: (sortBy) => set({ sortBy, currentPage: 1 }),
  setCurrentPage: (currentPage) => set({ currentPage }),
}));
