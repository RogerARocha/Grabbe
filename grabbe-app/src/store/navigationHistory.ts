import { create } from 'zustand';

interface NavigationHistoryState {
  historyStack: string[];
  currentIndex: number;
  pushPath: (path: string) => void;
  setIndexForPath: (index: number) => void;
}

export const useNavigationHistory = create<NavigationHistoryState>((set) => ({
  historyStack: [],
  currentIndex: -1,
  pushPath: (path) => set((state) => {
    // If the path is identical to the current one, do nothing
    if (state.historyStack[state.currentIndex] === path) {
      return state;
    }
    const newStack = state.historyStack.slice(0, state.currentIndex + 1);
    newStack.push(path);
    return {
      historyStack: newStack,
      currentIndex: newStack.length - 1,
    };
  }),
  setIndexForPath: (currentIndex) => set({ currentIndex })
}));
