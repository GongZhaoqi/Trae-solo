import axios from 'axios';
import type { ApiResponse, Case, Script, TrainingRecord, LearningProfile, LoginRequest, LoginResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: any): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};

export const casesApi = {
  getAll: async (): Promise<ApiResponse<Case[]>> => {
    const response = await apiClient.get('/cases');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Case>> => {
    const response = await apiClient.get(`/cases/${id}`);
    return response.data;
  },

  create: async (data: Partial<Case>): Promise<ApiResponse<Case>> => {
    const response = await apiClient.post('/cases', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Case>): Promise<ApiResponse<Case>> => {
    const response = await apiClient.put(`/cases/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/cases/${id}`);
    return response.data;
  },
};

export const scriptsApi = {
  generate: async (caseId: string): Promise<ApiResponse<Script>> => {
    const response = await apiClient.post(`/cases/${caseId}/generate-script`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Script>> => {
    const response = await apiClient.get(`/scripts/${id}`);
    return response.data;
  },

  getByCaseId: async (caseId: string): Promise<ApiResponse<Script>> => {
    const response = await apiClient.get(`/cases/${caseId}/script`);
    return response.data;
  },
};

export const trainingApi = {
  start: async (scriptId: string): Promise<ApiResponse<TrainingRecord>> => {
    const response = await apiClient.post('/training/start', { script_id: scriptId });
    return response.data;
  },

  submitDecision: async (recordId: string, decision: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/training/${recordId}/decision`, decision);
    return response.data;
  },

  complete: async (recordId: string): Promise<ApiResponse<TrainingRecord>> => {
    const response = await apiClient.post(`/training/${recordId}/complete`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<TrainingRecord>> => {
    const response = await apiClient.get(`/training/${id}`);
    return response.data;
  },

  getHistory: async (userId: string): Promise<ApiResponse<TrainingRecord[]>> => {
    const response = await apiClient.get(`/training/history/${userId}`);
    return response.data;
  },
};

export const learningApi = {
  getProfile: async (userId: string): Promise<ApiResponse<LearningProfile>> => {
    const response = await apiClient.get(`/learning/profile/${userId}`);
    return response.data;
  },

  getRecommendations: async (userId: string): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get(`/learning/recommendations/${userId}`);
    return response.data;
  },
};

export const multimodalApi = {
  startSession: async (): Promise<ApiResponse<{ session_id: string }>> => {
    const response = await apiClient.post('/multimodal/session/start');
    return response.data;
  },

  submitData: async (sessionId: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/multimodal/session/${sessionId}/data`, data);
    return response.data;
  },

  analyzeEmotion: async (data: any): Promise<ApiResponse<{ tension_level: number }>> => {
    const response = await apiClient.post('/multimodal/analyze/emotion', data);
    return response.data;
  },

  analyzeGesture: async (data: any): Promise<ApiResponse<{ accuracy_score: number }>> => {
    const response = await apiClient.post('/multimodal/analyze/gesture', data);
    return response.data;
  },
};

export default apiClient;
