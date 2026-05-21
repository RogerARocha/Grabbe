import { create } from 'zustand';
import { MediaType } from '../components/shared/types';

interface RankingState {
  activeTab: MediaType;
  nameSort: 'asc' | 'desc';
  scoreSort: 'asc' | 'desc';
  setActiveTab: (tab: MediaType) => void;
  setNameSort: (sort: 'asc' | 'desc') => void;
  setScoreSort: (sort: 'asc' | 'desc') => void;
}

export const useRankingStore = create<RankingState>((set) => ({
  activeTab: 'ALL',
  nameSort: 'asc',
  scoreSort: 'desc',
  setActiveTab: (activeTab) => set({ activeTab }),
  setNameSort: (nameSort) => set({ nameSort }),
  setScoreSort: (scoreSort) => set({ scoreSort }),
}));
