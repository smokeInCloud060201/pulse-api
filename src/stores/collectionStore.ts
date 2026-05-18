import { create } from 'zustand';
import { Collection, Folder } from '../types/collection';
import { collectionService } from '../services/collectionService';

interface CollectionState {
  collections: Collection[];
  folders: Record<string, Folder[]>; // Keyed by collection_id
  isLoading: boolean;

  loadCollections: () => Promise<void>;
  loadFolders: (collectionId: string) => Promise<void>;
  addCollection: (name: string, description?: string) => Promise<Collection>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, name: string) => Promise<void>;
  addFolder: (collectionId: string, parentFolderId: string | null, name: string) => Promise<Folder>;
  deleteFolder: (id: string, collectionId: string) => Promise<void>;
  updateFolder: (id: string, collectionId: string, name: string) => Promise<void>;
  importCollectionData: (collection: Collection, folders: Folder[], requests: any[]) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  folders: {},
  isLoading: false,

  loadCollections: async () => {
    set({ isLoading: true });
    try {
      const collections = await collectionService.getCollections();
      set({ collections });
      // Preload folders for all collections
      for (const col of collections) {
        await get().loadFolders(col.id);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  loadFolders: async (collectionId: string) => {
    const folders = await collectionService.getFolders(collectionId);
    set(state => ({
      folders: {
        ...state.folders,
        [collectionId]: folders
      }
    }));
  },

  addCollection: async (name: string, description?: string) => {
    const col = await collectionService.createCollection(name, description);
    await get().loadCollections();
    return col;
  },

  deleteCollection: async (id: string) => {
    await collectionService.deleteCollection(id);
    await get().loadCollections();
  },

  updateCollection: async (id: string, name: string) => {
    await collectionService.updateCollection(id, name);
    await get().loadCollections();
  },

  addFolder: async (collectionId: string, parentFolderId: string | null, name: string) => {
    const folder = await collectionService.createFolder(collectionId, parentFolderId, name);
    await get().loadFolders(collectionId);
    return folder;
  },

  deleteFolder: async (id: string, collectionId: string) => {
    await collectionService.deleteFolder(id);
    await get().loadFolders(collectionId);
  },

  updateFolder: async (id: string, collectionId: string, name: string) => {
    await collectionService.updateFolder(id, name);
    await get().loadFolders(collectionId);
  },

  importCollectionData: async (collection: Collection, folders: Folder[], requests: any[]) => {
    await collectionService.importCollectionData(collection, folders, requests);
    await get().loadCollections();
  }
}));
