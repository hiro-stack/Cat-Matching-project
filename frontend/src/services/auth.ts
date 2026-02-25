import api from '@/lib/api';
import { User, AuthResponse } from '@/types';

export const authService = {
  // ユーザー登録
  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/accounts/register/', data);
    return response.data;
  },

  // ログイン (HttpOnly Cookie をバックエンドが自動セット)
  login: async (data: any) => {
    const response = await api.post('/api/accounts/login/', data);
    return response.data;
  },

  // プロフィール取得
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/api/accounts/profile/');
    return response.data;
  },

  // プロフィール更新 (部分更新)
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch<User>('/api/accounts/profile/', data);
    return response.data;
  },

  // ログアウト (RefreshToken をブラックリスト化し HttpOnly Cookie を削除)
  logout: async () => {
    await api.post('/api/accounts/logout/', {});
  }
};
