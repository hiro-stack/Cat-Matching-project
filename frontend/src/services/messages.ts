import api from '@/lib/api';
import { Message, PaginatedResponse } from '@/types';

export const messagesService = {
  // メッセージ一覧取得 application指定必須
  // Note: MessageViewSet も router.register なので Pagination される
  getMessages: async (applicationId: number, page: number = 1) => {
    const response = await api.get<PaginatedResponse<Message>>(`/api/messages/?application=${applicationId}&page=${page}`);
    return response.data;
  },

  // メッセージ送信
  // Endpoint: /api/messages/
  // メッセージ送信
  // Endpoint: /api/messages/
  // 引数はCamelCaseで受け取り、APIにはSnakeCaseで送信する形を強制
  sendMessage: async (data: { applicationId: number; content: string }) => {
    const payload = {
      application_id: data.applicationId,
      content: data.content
    };
    const response = await api.post<Message>('/api/messages/', payload);
    return response.data;
  }
};
