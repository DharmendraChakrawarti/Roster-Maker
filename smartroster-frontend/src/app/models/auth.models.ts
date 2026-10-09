export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  fullName: string;
  department: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: string;
  department?: string;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  department?: string;
  role?: string;
  active?: boolean;
  newPassword?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  managerCount: number;
  userCount: number;
  activeEmployeesCount: number;
}
