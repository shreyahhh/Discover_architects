import { User, LoginCredentials, AuthResponse } from '../types';
import { api } from './api';

// In a real app, this would be stored securely
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.login(credentials);
      if (response.token) {
        localStorage.setItem(TOKEN_KEY, response.token);
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async validateToken(): Promise<User | null> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      
      const user = await api.validateToken();
      return user;
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser(): User | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    // In a real app, you might want to decode the JWT token here
    // For now, we'll just return null
    return null;
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    const user = authService.getCurrentUser();
    return !!user;
  },

  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  },

  // Additional methods
  signUp: async (email: string, password: string, username: string): Promise<User> => {
    return api.createUser(email, password, username);
  },

  updateProfile: (id: string, data: Partial<User>): void => {
    api.updateProfile(id, data);
  }
}; 