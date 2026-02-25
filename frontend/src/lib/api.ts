import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // ① HttpOnly Cookie を自動送信するために必須
  withCredentials: true,
});

// ① リクエストインターセプター:
//    トークンは HttpOnly Cookie で自動送信されるため、手動の Authorization ヘッダー注入は不要
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// Token Refresh Queue: 複数の 401 が同時に発生した場合に 1 回だけリフレッシュする
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// レスポンスインターセプター: 401 時に Cookie の RefreshToken でサイレントリフレッシュ
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 既にリフレッシュ中なら完了を待ってリトライ
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ③ Cookie に入っている RefreshToken を自動送信 (withCredentials: true)
        //    バックエンドが新しい access_token を HttpOnly Cookie にセットする
        await axios.post(
          `${API_URL}/api/accounts/token/refresh/`,
          {},
          { withCredentials: true },
        );

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // リフレッシュ失敗 → エラーを呼び出し元に伝播させる
        // リダイレクトは各ページのエラーハンドラに任せる（ホームなどパブリックページへの誤リダイレクトを防ぐ）
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
