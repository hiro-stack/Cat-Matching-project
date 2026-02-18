import api from '@/lib/api';
import { CatList, CatDetail, CatFilters, CatImage, PaginatedResponse } from '@/types';

export const catsService = {
  // 保護猫一覧取得 (Paginated)
  getCats: async (filters?: CatFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.status) params.append('status', filters.status);
      if (filters.age_category) params.append('age_category', filters.age_category);
      if (filters.prefecture) params.append('prefecture', filters.prefecture);
      if (filters.activity_level) params.append('activity_level', filters.activity_level);
      if (filters.affection_level) params.append('affection_level', String(filters.affection_level));
      if (filters.maintenance_level) params.append('maintenance_level', filters.maintenance_level);
      if (filters.shelter_id) params.append('shelter_id', String(filters.shelter_id));
      // Backendのページング仕様に合わせる
      if (filters.page) params.append('page', String(filters.page));
    }
    
    // NOTE: BackendでPaginatedResponse<CatList>を返すように設定変更済み前提
    const response = await api.get<PaginatedResponse<CatList>>(`/api/cats/?${params.toString()}`);
    return response.data;
  },

  // 保護猫詳細取得
  getCat: async (id: number) => {
    const response = await api.get<CatDetail>(`/api/cats/${id}/`);
    return response.data;
  },

  // 保護猫登録 (Shelterのみ)
  createCat: async (data: Partial<CatDetail>) => {
    const response = await api.post<CatDetail>('/api/cats/', data);
    return response.data;
  },

  // 保護猫更新 (Shelterのみ)
  updateCat: async (id: number, data: Partial<CatDetail>) => {
    const response = await api.patch<CatDetail>(`/api/cats/${id}/`, data);
    return response.data;
  },

  // 保護猫削除 (Shelterのみ)
  deleteCat: async (id: number) => {
    await api.delete(`/api/cats/${id}/`);
  },

  // 画像アップロード
  uploadImage: async (catId: number, file: File, isPrimary: boolean = false) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_primary', String(isPrimary));
    
    const response = await api.post<CatImage>(`/api/cats/${catId}/images/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 自団体の猫一覧
  // NOTE: こちらもPaginationされる可能性があるが、一旦Listで受けるか確認が必要。
  // 今回のBackend変更ではGlobalにPaginationが入ったため、こちらもPaginatedResponseになる。
  getMyCats: async (page: number = 1) => {
    const response = await api.get<PaginatedResponse<CatList>>(`/api/cats/my_cats/?page=${page}`);
    return response.data;
  }
};
