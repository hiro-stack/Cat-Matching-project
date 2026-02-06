import api from '@/lib/api';
import { User, AuthResponse } from '@/types';

export const authService = {
  // ユーザー登録
  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/accounts/register/', data);
    return response.data;
  },

  // ログイン (Token取得)
  login: async (data: any) => {
    const response = await api.post('/api/accounts/login/', data);
    return response.data; // { access, refresh }
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

  // ログアウト (サーバーサイドでブラックリスト化する場合など。現在はクライアント側削除のみで十分だがIFとして用意)
  logout: async () => {
    // 必要なら /api/accounts/logout/ などを呼ぶ
  }
};
