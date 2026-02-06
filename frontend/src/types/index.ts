export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// エラーレスポンス型 (DRF標準)
export type ApiError = {
  detail?: string;            // 認証・権限・404等の汎用エラーメッセージ
  code?: string;              // エラーコード (optional)
  non_field_errors?: string[]; // 特定のフィールドに紐づかないバリデーションエラー
} & {
  // フィールドごとのバリデーションエラー { "email": ["この項目は必須です。"] }
  [key: string]: string[] | string | undefined; 
};

export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'adopter' | 'shelter' | 'admin';
  profile_image?: string; 
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// Enums
export type Gender = 'male' | 'female' | 'unknown';
export type Size = 'small' | 'medium' | 'large';
export type CatStatus = 'draft' | 'available' | 'negotiating' | 'trial' | 'transferred' | 'withdrawn';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CatImage {
  id: number;
  image: string; // URL
  image_url: string; // Absolute URL
  is_primary: boolean;
  sort_order: number;
  caption?: string;
  created_at: string;
}

export interface CatVideo {
  id: number;
  video: string; 
  video_url: string; 
  sort_order: number;
  caption?: string;
  created_at: string;
}

// Cat Listing (Matched with UI Specs)
export interface CatList {
  id: number;
  name: string;
  breed: string;
  gender: Gender;
  age: number; // 歳
  status: CatStatus;
  main_image_url: string | null;
  shelter_name: string;
  created_at: string;
}

// Cat Detail (Full version)
export interface CatDetail extends Omit<CatList, 'main_image_url'> {
  color?: string;
  personality?: string;
  description?: string;
  images: CatImage[];
  videos: CatVideo[];
  shelter_id?: number;
  shelter: { // Expanded shelter info
      id: number;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
  };
  updated_at?: string;
}

export interface CatFilters {
  search?: string;
  gender?: Gender;
  status?: CatStatus;
  min_age?: number;
  max_age?: number;
  page?: number;
}

export interface Application {
  id: number;
  cat: number | CatList; // Depends on serializer depth
  applicant: number | User;
  shelter: number;
  status: ApplicationStatus;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  application: number;
  sender: number | User;
  sender_type: 'admin' | 'shelter' | 'user';
  content: string;
  is_read: boolean;
  created_at: string;
}
