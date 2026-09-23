// Shared helpers for talking to the Express backend. Centralized so the
// auth token's localStorage key only has to be right in one place — a past
// mismatch here (services/api.ts read 'auth_token' while AuthContext writes
// 'token') silently broke every authenticated request that relied on it.

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'token';

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const authHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
