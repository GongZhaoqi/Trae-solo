import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Case, TrainingRecord, LearningProfile } from '@/types';
import { authApi, casesApi, trainingApi, learningApi } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ username, password });
          if (response.success && response.data) {
            localStorage.setItem('access_token', response.data.access_token);
            set({ user: response.data.user, isAuthenticated: true });
          } else {
            throw new Error(response.error || 'Login failed');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            set({ user: response.data, isAuthenticated: true });
          } else {
            get().logout();
          }
        } catch {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface CasesState {
  cases: Case[];
  currentCase: Case | null;
  isLoading: boolean;
  fetchCases: () => Promise<void>;
  fetchCaseById: (id: string) => Promise<void>;
  createCase: (data: Partial<Case>) => Promise<void>;
  updateCase: (id: string, data: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
}

export const useCasesStore = create<CasesState>((set, get) => ({
  cases: [],
  currentCase: null,
  isLoading: false,

  fetchCases: async () => {
    set({ isLoading: true });
    try {
      const response = await casesApi.getAll();
      if (response.success && response.data) {
        set({ cases: response.data });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCaseById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await casesApi.getById(id);
      if (response.success && response.data) {
        set({ currentCase: response.data });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  createCase: async (data: Partial<Case>) => {
    set({ isLoading: true });
    try {
      const response = await casesApi.create(data);
      if (response.success && response.data) {
        set((state) => ({ cases: [...state.cases, response.data!] }));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateCase: async (id: string, data: Partial<Case>) => {
    set({ isLoading: true });
    try {
      const response = await casesApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          cases: state.cases.map((c) => (c.id === id ? response.data! : c)),
          currentCase: state.currentCase?.id === id ? response.data : state.currentCase,
        }));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCase: async (id: string) => {
    set({ isLoading: true });
    try {
      await casesApi.delete(id);
      set((state) => ({
        cases: state.cases.filter((c) => c.id !== id),
        currentCase: state.currentCase?.id === id ? null : state.currentCase,
      }));
    } finally {
      set({ isLoading: false });
    }
  },
}));

interface TrainingState {
  currentRecord: TrainingRecord | null;
  isTraining: boolean;
  startTraining: (scriptId: string) => Promise<void>;
  submitDecision: (recordId: string, decision: any) => Promise<void>;
  completeTraining: (recordId: string) => Promise<void>;
  resetTraining: () => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  currentRecord: null,
  isTraining: false,

  startTraining: async (scriptId: string) => {
    set({ isTraining: true });
    try {
      const response = await trainingApi.start(scriptId);
      if (response.success && response.data) {
        set({ currentRecord: response.data });
      }
    } catch (error) {
      console.error('Failed to start training:', error);
      set({ isTraining: false });
    }
  },

  submitDecision: async (recordId: string, decision: any) => {
    try {
      const response = await trainingApi.submitDecision(recordId, decision);
      if (response.success && response.data) {
        set({ currentRecord: response.data });
      }
    } catch (error) {
      console.error('Failed to submit decision:', error);
    }
  },

  completeTraining: async (recordId: string) => {
    try {
      const response = await trainingApi.complete(recordId);
      if (response.success && response.data) {
        set({ currentRecord: response.data, isTraining: false });
      }
    } catch (error) {
      console.error('Failed to complete training:', error);
    }
  },

  resetTraining: () => {
    set({ currentRecord: null, isTraining: false });
  },
}));

interface LearningState {
  profile: LearningProfile | null;
  isLoading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  fetchRecommendations: (userId: string) => Promise<string[]>;
}

export const useLearningStore = create<LearningState>((set) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async (userId: string) => {
    set({ isLoading: true });
    try {
      const response = await learningApi.getProfile(userId);
      if (response.success && response.data) {
        set({ profile: response.data });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRecommendations: async (userId: string) => {
    try {
      const response = await learningApi.getRecommendations(userId);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  },
}));
