export interface AuthUser {
  id: string;
  email: string;
  password: string;
  refresh_token?: string;
  last_sign_in?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  auth_id: string;
  firstname: string;
  lastname: string;
  role?: {
    id: string;
    name: string;
    key: string;
    permissions: {
      id: string;
      name: string;
      key: string;
      description: string;
    }[];
  };
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: Omit<UserProfile, 'auth_id'>;
  accessToken: string;
  refreshToken: string;
}
