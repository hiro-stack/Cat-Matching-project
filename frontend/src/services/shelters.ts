import api from "@/lib/api";

export interface ShelterPublic {
  id: number;
  name: string;
  shelter_type: string;
  prefecture: string;
  city: string;
  logo_image: string | null;
  header_image: string | null;
  description: string;
  website_url: string;
  sns_url: string;
  rescue_accepting: boolean;
  rescue_area_text: string;
  rescue_notes: string;
  support_goods_url: string;
  support_donation_url: string;
  support_message: string;
  created_at: string;
}

export const sheltersService = {
  // 一般公開用プロフィール取得
  getPublicProfile: async (id: number): Promise<ShelterPublic> => {
    const response = await api.get(`/api/shelters/public/${id}/`);
    return response.data;
  },
  
  // 自団体のプロフィール取得 (管理画面用)
  getMyShelter: async (): Promise<any> => {
    const response = await api.get('/api/shelters/my-shelter/');
    return response.data;
  },
  
  // 自団体のプロフィール更新 (管理画面用)
  updateMyShelter: async (id: number, data: any): Promise<any> => {
    const response = await api.patch(`/api/shelters/${id}/`, data);
    return response.data;
  }
};
