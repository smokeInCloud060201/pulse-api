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
  markTabSaved: (id: string) => void;
  updateTabId: (oldId: string, newId: string, request: ApiRequest) => void;
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
      const savedTabs = (await tauriStore.get('tabs')) as Tab[] | null;
      const savedActiveTab = (await tauriStore.get('activeTabId')) as string | null;

      const processedTabs = (savedTabs || []).map(t => {
        if (!t.request.collection_id) {
          return { ...t, isDirty: true };
        }
        return t;
      });

      set({
        tabs: processedTabs,
        activeTabId: savedActiveTab || null,
        isInitialized: true
      });
    } catch (e) {
      console.error('Failed to load tab state', e);
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
      const isDirty = !request.collection_id;
      set({ tabs: [...tabs, { id: request.id, request, isDirty }], activeTabId: request.id });
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
      tabs: tabs.map(t => (t.id === request.id ? { ...t, request, isDirty: true } : t))
    });
    get().saveState();
  },

  markTabSaved: (id: string) => {
    const { tabs } = get();
    set({
      tabs: tabs.map(t => (t.id === id ? { ...t, isDirty: false } : t))
    });
    get().saveState();
  },

  updateTabId: (oldId: string, newId: string, request: ApiRequest) => {
    const { tabs, activeTabId } = get();
    set({
      tabs: tabs.map(t => (t.id === oldId ? { ...t, id: newId, request, isDirty: false } : t)),
      activeTabId: activeTabId === oldId ? newId : activeTabId
    });
    get().saveState();
  }
}));
