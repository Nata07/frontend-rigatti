export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
