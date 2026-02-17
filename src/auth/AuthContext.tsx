import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import { authApi } from '../api/endpoints';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    const { accessToken: jwt, user: userData } = response.data;

    const authUser: AuthUser = {
      idUser: userData.idUser,
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role?.name || 'UNKNOWN',
      locationIds: userData.locations?.map((l) => l.idLocationUnit) || [],
    };

    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(authUser));
    setToken(jwt);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
