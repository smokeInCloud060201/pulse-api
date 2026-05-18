import { create } from 'zustand';

interface UiState {
  isEnvManagerOpen: boolean;
  setEnvManagerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>(set => ({
  isEnvManagerOpen: false,
  setEnvManagerOpen: (open: boolean) => set({ isEnvManagerOpen: open })
}));
