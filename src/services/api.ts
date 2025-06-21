import { User, Profile, LoginCredentials, AuthResponse, GalleryImage } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = {
  // User operations
  createUser: async (email: string, password: string, username: string): Promise<User> => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.json();
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const response = await fetch(`${API_URL}/users/email/${email}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  },

  getUserById: async (id: string): Promise<User | null> => {
    const response = await fetch(`${API_URL}/users/${id}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    return response.json();
  },

  validateToken: async (): Promise<User | null> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const response = await fetch(`${API_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to validate token');
    }

    return response.json();
  },

  // Profile operations
  updateProfile: async (id: string, data: Partial<Profile>): Promise<void> => {
    const response = await fetch(`${API_URL}/profiles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Gallery operations
  getGalleryImages: async (): Promise<GalleryImage[]> => {
    const response = await fetch(`${API_URL}/api/gallery`);
    if (!response.ok) {
      throw new Error('Failed to fetch gallery images');
    }
    return response.json();
  },

  addGalleryImage: async (file: File, title: string): Promise<GalleryImage> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    const response = await fetch(`${API_URL}/api/gallery`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
    });
    if (!response.ok) {
      throw new Error('Failed to add image');
    }
    return response.json();
  },

  deleteGalleryImage: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/gallery/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  },
}; 