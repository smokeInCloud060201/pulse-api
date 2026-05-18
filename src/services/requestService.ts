import { invoke } from '@tauri-apps/api/core';
import { ApiRequest, ApiResponse } from '../types/request';

export const requestService = {
  createRequest: async (collectionId: string, folderId: string | null, name: string): Promise<ApiRequest> => {
    return invoke('create_request', { collectionId, folderId, name });
  },

  getRequests: async (collectionId: string): Promise<ApiRequest[]> => {
    return invoke('get_requests', { collectionId });
  },

  updateRequest: async (request: ApiRequest): Promise<ApiRequest> => {
    return invoke('update_request', { request });
  },

  deleteRequest: async (id: string): Promise<void> => {
    return invoke('delete_request', { id });
  },

  executeRequest: async (id: string): Promise<ApiResponse> => {
    return invoke('execute_request', { id });
  }
};
