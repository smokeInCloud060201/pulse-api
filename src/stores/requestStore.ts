import { create } from 'zustand';
import { ApiRequest } from '../types/request';
import { requestService } from '../services/requestService';

interface RequestState {
  requests: Record<string, ApiRequest[]>; // Keyed by collection_id
  
  loadRequests: (collectionId: string) => Promise<void>;
  createRequest: (collectionId: string, folderId: string | null, name: string) => Promise<ApiRequest>;
  updateRequest: (request: ApiRequest) => Promise<void>;
  deleteRequest: (id: string, collectionId: string) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: {},

  loadRequests: async (collectionId: string) => {
    const reqs = await requestService.getRequests(collectionId);
    set((state) => ({
      requests: {
        ...state.requests,
        [collectionId]: reqs
      }
    }));
  },

  createRequest: async (collectionId: string, folderId: string | null, name: string) => {
    const newReq = await requestService.createRequest(collectionId, folderId, name);
    await get().loadRequests(collectionId);
    return newReq;
  },

  updateRequest: async (request: ApiRequest) => {
    await requestService.updateRequest(request);
    await get().loadRequests(request.collection_id);
  },

  deleteRequest: async (id: string, collectionId: string) => {
    await requestService.deleteRequest(id);
    await get().loadRequests(collectionId);
  }
}));
