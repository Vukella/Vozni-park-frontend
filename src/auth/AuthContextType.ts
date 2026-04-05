import type { AuthUser } from '../types';

export interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
    isLoading: boolean;
    otpUsername: string | null;
    login: (username: string, password: string) => Promise<'OTP_REQUIRED' | void>;
    verifyOtp: (otp: string) => Promise<void>;
    logout: () => void;
}