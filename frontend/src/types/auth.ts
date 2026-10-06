export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  active: boolean;
  roles: string[];
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleName: string;
}

export interface UpdateUserData {
  fullName: string;
  phone?: string;
  active?: boolean;
  roleName?: string;
}
