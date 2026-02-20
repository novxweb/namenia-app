import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updateProfile: (updates: { full_name?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
