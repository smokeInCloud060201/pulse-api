import { create } from 'zustand';
import { Environment, EnvVariable } from '../types/environment';
import { EnvironmentService } from '../services/environmentService';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  loading: boolean;
  error: string | null;
  
  fetchEnvironments: () => Promise<void>;
  setActiveEnvironment: (id: string | null) => void;
  createEnvironment: (id: string, name: string) => Promise<Environment>;
  updateEnvironment: (id: string, name: string, variables: EnvVariable[]) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  environments: [],
  activeEnvironmentId: null,
  loading: false,
  error: null,

  fetchEnvironments: async () => {
    set({ loading: true, error: null });
    try {
      const environments = await EnvironmentService.getEnvironments();
      set({ environments, loading: false });
    } catch (err: any) {
      set({ error: err.toString(), loading: false });
    }
  },

  setActiveEnvironment: (id: string | null) => {
    set({ activeEnvironmentId: id });
  },

  createEnvironment: async (id: string, name: string) => {
    try {
      const newEnv = await EnvironmentService.createEnvironment(id, name);
      set(state => ({ environments: [...state.environments, newEnv] }));
      return newEnv;
    } catch (err: any) {
      throw err;
    }
  },

  updateEnvironment: async (id: string, name: string, variables: EnvVariable[]) => {
    try {
      await EnvironmentService.updateEnvironment(id, name, variables);
      set(state => ({
        environments: state.environments.map(e => e.id === id ? { ...e, name, variables } : e)
      }));
    } catch (err: any) {
      throw err;
    }
  },

  deleteEnvironment: async (id: string) => {
    try {
      await EnvironmentService.deleteEnvironment(id);
      set(state => ({
        environments: state.environments.filter(e => e.id !== id),
        activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId
      }));
    } catch (err: any) {
      throw err;
    }
  }
}));
