import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import { authApi } from '../api/endpoints';
import { AuthContext } from './AuthContextDef';
import type { AuthContextType } from './AuthContextType';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [isLoading] = useState(false);
  const [otpUsername, setOtpUsername] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string): Promise<'OTP_REQUIRED' | void> => {
    const response = await authApi.login({ username, password });

    if (response.data.status === 'OTP_REQUIRED') {
      setOtpUsername(username);
      return 'OTP_REQUIRED';
    }

    const { accessToken: jwt, user: userData } = response.data;

    if (!jwt || !userData) {
      throw new Error('Invalid login response');
    }
    const authUser: AuthUser = {
      idUser: userData.idUser,
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role?.name || 'UNKNOWN',
      locationIds: userData.locations?.map((l: { idLocationUnit: number }) => l.idLocationUnit) || [],
    };

    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(authUser));
    setToken(jwt);
    setUser(authUser);
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    if (!otpUsername) throw new Error('No pending OTP session');

    const response = await authApi.verifyOtp({ username: otpUsername, otp });
    const { accessToken: jwt, user: userData } = response.data;

    if (!jwt || !userData) {
      throw new Error('Invalid OTP verification response');
    }

    const authUser: AuthUser = {
      idUser: userData.idUser,
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role?.name || 'UNKNOWN',
      locationIds: userData.locations?.map((l: { idLocationUnit: number }) => l.idLocationUnit) || [],
    };

    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(authUser));
    setToken(jwt);
    setUser(authUser);
    setOtpUsername(null);
  }, [otpUsername]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setOtpUsername(null);
  }, []);

  const value = useMemo(
      () => ({
        user,
        token,
        isAuthenticated: !!token && !!user,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isLoading,
        otpUsername,
        login,
        verifyOtp,
        logout,
      }),
      [user, token, isLoading, otpUsername, login, verifyOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
export type { AuthContextType };