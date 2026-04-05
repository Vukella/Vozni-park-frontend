import { createContext } from 'react';
import type { AuthContextType } from './AuthContextType';

export const AuthContext = createContext<AuthContextType | null>(null);