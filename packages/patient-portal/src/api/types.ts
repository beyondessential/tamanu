export interface LoginCredentials {
  loginToken: string;
  email?: string;
}

export interface LoginResponse {
  token: string;
  user: any; // Replace with your actual user type
}

export interface RequestLoginTokenResponse {
  email: string;
}
