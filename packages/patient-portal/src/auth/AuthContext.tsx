import { createContext } from 'react';

export interface AuthContextType {
  user: any | null; // Using any for now instead of importing JS types
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
});
