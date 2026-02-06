import api from '@/lib/api';
import { Application, PaginatedResponse, ApplicationStatus } from '@/types';

export const applicationsService = {
  // 応募一覧取得
  getApplications: async (page: number = 1) => {
    const response = await api.get<PaginatedResponse<Application>>(`/api/applications/?page=${page}`);
    return response.data;
  },

  // 詳細取得
  getApplication: async (id: number) => {
    const response = await api.get<Application>(`/api/applications/${id}/`);
    return response.data;
  },

  // 応募作成
  createApplication: async (data: { cat: number; message: string }) => {
    const response = await api.post<Application>('/api/applications/', data);
    return response.data;
  },

  // ステータス更新 (Shelterのみ)
  // Endpoint: /api/applications/{id}/status/
  updateStatus: async (id: number, status: ApplicationStatus) => {
    const response = await api.patch<Application>(`/api/applications/${id}/status/`, { status });
    return response.data;
  }
};
