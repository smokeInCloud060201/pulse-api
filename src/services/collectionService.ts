import { invoke } from '@tauri-apps/api/core';
import { Collection, Folder } from '../types/collection';

export const collectionService = {
  getCollections: async (): Promise<Collection[]> => {
    return invoke('get_collections');
  },

  createCollection: async (name: string, description?: string): Promise<Collection> => {
    return invoke('create_collection', { name, description });
  },

  deleteCollection: async (id: string): Promise<void> => {
    return invoke('delete_collection', { id });
  },

  updateCollection: async (id: string, name: string): Promise<void> => {
    return invoke('update_collection', { id, name });
  },

  getFolders: async (collectionId: string): Promise<Folder[]> => {
    return invoke('get_folders', { collectionId });
  },

  createFolder: async (collectionId: string, parentFolderId: string | null, name: string): Promise<Folder> => {
    return invoke('create_folder', { collectionId, parentFolderId, name });
  },

  deleteFolder: async (id: string): Promise<void> => {
    return invoke('delete_folder', { id });
  },

  updateFolder: async (id: string, name: string): Promise<void> => {
    return invoke('update_folder', { id, name });
  },

  importCollectionData: async (collection: Collection, folders: Folder[], requests: any[]): Promise<void> => {
    return invoke('import_collection_data', { collection, folders, requests });
  }
};
