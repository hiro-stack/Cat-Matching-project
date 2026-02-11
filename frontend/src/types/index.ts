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

export interface ApplicantProfile {
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | 'no_answer' | null;
  residence_area?: string | null;
  housing_type?: 'owned' | 'rented' | null;
  pet_allowed?: 'allowed' | 'planned' | 'not_allowed' | null;
  indoors_agreement?: boolean;
  absence_time?: 'less_than_4' | '4_to_8' | '8_to_12' | 'more_than_12' | null;
  home_frequency?: 'high' | 'medium' | 'low' | null;
  
  cat_experience?: 'none' | 'one' | 'multiple' | null;
  cat_distance?: 'clingy' | 'moderate' | 'watchful' | null;
  home_atmosphere?: 'quiet' | 'normal' | 'lively' | null;
  visitor_frequency?: 'high' | 'medium' | 'low' | null;
  moving_plan?: 'none' | 'within_1_2_years' | 'undecided' | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'adopter' | 'shelter' | 'admin';
  phone_number?: string;
  address?: string;
  profile_image?: string;
  bio?: string;
  created_at?: string;
  shelter_role?: 'admin' | 'staff';
  shelter_info?: {
    id: number;
    name: string;
    verification_status: 'pending' | 'approved' | 'rejected' | 'need_fix' | 'suspended';
    review_message?: string;
  };
  is_superuser?: boolean;
  applicant_profile?: ApplicantProfile;
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
export type CatStatus = 'open' | 'in_review' | 'trial' | 'adopted' | 'paused';
export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'cancelled';

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
  age_category: string;
  estimated_age: string;
  status: CatStatus;
  primary_image: string | null;
  shelter_name: string;
  created_at: string;
   // API response might include computed fields
  main_image_url?: string;
  is_favorited?: boolean;
}

// Cat Detail (Full version)
export interface CatDetail extends Omit<CatList, 'main_image_url'> {
  color?: string;
  size: Size;

  // Health Info
  spay_neuter_status: string;
  vaccination_status: string;
  health_status_category: string;
  fiv_felv_status: string;
  health_notes?: string;

  // Personality
  human_distance: string;
  activity_level: string;
  personality: string;

  // Transfer Conditions
  interview_format: string;
  trial_period?: string;
  transfer_fee: number;
  fee_details?: string;

  description: string;
  images: CatImage[];
  videos: CatVideo[];

  shelter: {
    id: number;
    name: string;
    shelter_type: string;
    prefecture: string;
    city: string;
    address: string;
    phone?: string;
    email?: string;
    website_url?: string;
    sns_url?: string;
    business_hours?: string;
    transfer_available_hours?: string;
  };
  updated_at?: string;
  is_favorited?: boolean;
}

export interface CatFilters {
  search?: string;
  gender?: Gender;
  status?: CatStatus;
  age_category?: 'kitten' | 'adult' | 'senior' | 'unknown';
  prefecture?: string;
  activity_level?: 'active' | 'normal' | 'calm' | 'unknown';
  page?: number;
}

export interface Application {
  id: number;
  cat: number | CatList; // Depends on serializer depth
  applicant: number | User;
  shelter: number;
  status: ApplicationStatus;
  message: string;
  
  // Consent fields
  term_agreement?: boolean;
  lifelong_care_agreement?: boolean;
  spay_neuter_agreement?: boolean;
  medical_cost_understanding?: boolean;
  income_status?: 'stable' | 'unstable';
  emergency_contact_available?: boolean;
  family_consent?: boolean;
  allergy_status?: boolean;
  cafe_data_sharing_consent?: boolean;

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

export interface ShelterMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  joined_at: string;
}
