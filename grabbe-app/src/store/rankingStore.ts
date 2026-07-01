import { create } from 'zustand';
import { MediaType } from '../components/shared/types';

interface RankingState {
  activeTab: MediaType;
  nameSort: 'asc' | 'desc';
  scoreSort: 'asc' | 'desc';
  selectedGenres: string[];
  items: any[];
  isLoading: boolean;
  scrollPosition: number;
  setActiveTab: (tab: MediaType) => void;
  setNameSort: (sort: 'asc' | 'desc') => void;
  setScoreSort: (sort: 'asc' | 'desc') => void;
  setSelectedGenres: (genres: string[]) => void;
  setItems: (items: any[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setScrollPosition: (scrollPosition: number) => void;
}

export const useRankingStore = create<RankingState>((set) => ({
  activeTab: 'ALL',
  nameSort: 'asc',
  scoreSort: 'desc',
  selectedGenres: [],
  items: [],
  isLoading: true,
  scrollPosition: 0,
  setActiveTab: (activeTab) => set({ activeTab, items: [], isLoading: true, selectedGenres: [], scrollPosition: 0 }),
  setNameSort: (nameSort) => set({ nameSort }),
  setScoreSort: (scoreSort) => set({ scoreSort }),
  setSelectedGenres: (selectedGenres) => set({ selectedGenres }),
  setItems: (items) => set({ items }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
}));
