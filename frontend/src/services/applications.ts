import api from '@/lib/api';
import { Application, PaginatedResponse, ApplicationStatus } from '@/types';

// ステータス更新のレスポンス型
export interface StatusUpdateResponse {
  id: number;
  status: ApplicationStatus;
  status_display: string;
  updated_at: string;
  allowed_actions: ApplicationStatus[];
}

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

  // 応募作成（冪等化対応）
  createApplication: async (data: { cat: number; message: string; [key: string]: any }) => {
    const response = await api.post<Application | { id: number; status: string; updated_at: string; detail: string }>(
      '/api/applications/', data
    );
    return response.data;
  },

  // ステータス更新 (Shelterのみ) - レスポンスにallowed_actionsを含む
  updateStatus: async (id: number, newStatus: ApplicationStatus): Promise<StatusUpdateResponse> => {
    const response = await api.patch<StatusUpdateResponse>(
      `/api/applications/${id}/status/`, { status: newStatus }
    );
    return response.data;
  },

  // 応募アーカイブ
  archiveApplication: async (id: number) => {
    const response = await api.post(`/api/applications/${id}/archive/`);
    return response.data;
  },
};
