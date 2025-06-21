export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface LoginCredentials {
  username: string; // This will be the email for Supabase
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Profile {
  id: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
    };
  };
}

export interface GalleryImage {
  id: number;
  src: string;
  title: string;
} 