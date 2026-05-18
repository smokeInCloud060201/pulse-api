import { create } from 'zustand';
import { load } from '@tauri-apps/plugin-store';
import { ApiRequest } from '../types/request';

export interface Tab {
  id: string; // The request ID
  request: ApiRequest;
  isDirty?: boolean;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  isInitialized: boolean;

  init: () => Promise<void>;
  openTab: (request: ApiRequest) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabRequest: (request: ApiRequest) => void;
  saveState: () => Promise<void>;
}

let tauriStore: any = null;

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isInitialized: false,

  init: async () => {
    try {
      tauriStore = await load('tabs-state.json');
      const savedTabs = await tauriStore.get<Tab[]>('tabs');
      const savedActiveTab = await tauriStore.get<string>('activeTabId');
      
      set({ 
        tabs: savedTabs || [], 
        activeTabId: savedActiveTab || null,
        isInitialized: true
      });
    } catch (e) {
      console.error("Failed to load tab state", e);
      set({ isInitialized: true });
    }
  },

  saveState: async () => {
    if (!tauriStore) return;
    const { tabs, activeTabId } = get();
    await tauriStore.set('tabs', tabs);
    await tauriStore.set('activeTabId', activeTabId);
    await tauriStore.save();
  },

  openTab: (request: ApiRequest) => {
    const { tabs } = get();
    const existing = tabs.find(t => t.id === request.id);
    
    if (existing) {
      set({ activeTabId: request.id });
    } else {
      set({ tabs: [...tabs, { id: request.id, request }], activeTabId: request.id });
    }
    get().saveState();
  },

  closeTab: (id: string) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter(t => t.id !== id);
    
    let newActiveId = activeTabId;
    if (activeTabId === id) {
      // Pick the next or previous tab
      if (newTabs.length > 0) {
        newActiveId = newTabs[newTabs.length - 1].id;
      } else {
        newActiveId = null;
      }
    }
    
    set({ tabs: newTabs, activeTabId: newActiveId });
    get().saveState();
  },

  setActiveTab: (id: string) => {
    set({ activeTabId: id });
    get().saveState();
  },

  updateTabRequest: (request: ApiRequest) => {
    const { tabs } = get();
    set({
      tabs: tabs.map(t => t.id === request.id ? { ...t, request, isDirty: true } : t)
    });
    get().saveState();
  }
}));
