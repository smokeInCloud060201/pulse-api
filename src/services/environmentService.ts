import { invoke } from '@tauri-apps/api/core';
import { Environment, EnvVariable } from '../types/environment';

export const EnvironmentService = {
  getEnvironments: async (): Promise<Environment[]> => {
    return invoke('get_environments');
  },

  createEnvironment: async (id: string, name: string): Promise<Environment> => {
    return invoke('create_environment', { id, name });
  },

  updateEnvironment: async (id: string, name: string, variables: EnvVariable[]): Promise<void> => {
    return invoke('update_environment', { id, name, variables });
  },

  deleteEnvironment: async (id: string): Promise<void> => {
    return invoke('delete_environment', { id });
  }
};
