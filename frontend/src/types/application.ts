export interface Application {
  id: number;
  cat: number | CatList; 
  applicant: number | User;
  shelter: number;
  status: ApplicationStatus; // 'pending' | 'approved' | 'rejected' | 'cancelled'
  message: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
