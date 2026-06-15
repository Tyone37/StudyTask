export interface User {
  id: number;
  fullName: string;
  email: string;
  authProvider?: 'local' | 'google' | 'both';
  avatarUrl?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
