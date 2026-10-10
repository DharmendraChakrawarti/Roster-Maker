export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  fullName: string;
  department: string;
  active: boolean;
  managerId?: number;
  managerName?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ManagerSummary {
  id: number;
  fullName: string;
  username: string;
  department: string;
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
  managerId?: number;
  managerName?: string;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  department?: string;
  role?: string;
  active?: boolean;
  newPassword?: string;
  managerId?: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  managerCount: number;
  userCount: number;
  activeEmployeesCount: number;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  userCount: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

