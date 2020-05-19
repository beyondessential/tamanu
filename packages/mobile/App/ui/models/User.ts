export interface UserModel {
  id: number;
  email: string;
  password?: string;
  displayName: string;
  role: string;
  gender: string;
}
