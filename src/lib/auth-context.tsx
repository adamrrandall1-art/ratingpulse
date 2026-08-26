'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string,
    businessName?: string
  ) => Promise<{ error: string | null; confirmationRequired?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for local preview mode
const mockDemoUser: User = {
  id: 'usr_mock_001',
  app_metadata: {},
  user_metadata: {
    full_name: 'Dr. Marcus Vance',
    business_name: 'Apex Dental & Aesthetics',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'dr.marcus@apexdental.com',
  phone: '+1 (555) 234-8900',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check URL parameters or hash for recovery token immediately on mount
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        hash.includes('access_token=') && hash.includes('type=recovery')
      ) {
        router.push('/reset-password');
      }
    }

    if (isSupabaseConfigured && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      // Listen for auth state changes including PASSWORD_RECOVERY
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'PASSWORD_RECOVERY') {
          router.push('/reset-password');
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Standalone local demo state
      const demoAuth = localStorage.getItem('ratingpulse_demo_auth');
      if (demoAuth === 'true') {
        setUser(mockDemoUser);
      }
      setIsLoading(false);
    }
  }, [router]);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setIsLoading(false);
      return { error: error ? error.message : null };
    }

    // Local fallback demo mode
    localStorage.setItem('ratingpulse_demo_auth', 'true');
    setUser({ ...mockDemoUser, email });
    setIsLoading(false);
    return { error: null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string,
    businessName?: string
  ) => {
    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
          },
          emailRedirectTo: 'https://ratingpulse.co/auth/callback',
        },
      });

      if (!error && email) {
        // Non-blocking welcome email trigger
        fetch('/api/auth/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: fullName,
            userId: data?.user?.id,
          }),
        }).catch((e) => console.warn('[Welcome email fetch error]:', e));
      }

      setIsLoading(false);
      return {
        error: error ? error.message : null,
        confirmationRequired: !data.session,
      };
    }

    // Local fallback demo mode
    localStorage.setItem('ratingpulse_demo_auth', 'true');
    setUser({
      ...mockDemoUser,
      email,
      user_metadata: {
        full_name: fullName || 'Business Owner',
        business_name: businessName || 'My Business',
      },
    });
    setIsLoading(false);
    return { error: null, confirmationRequired: false };
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://ratingpulse.co/auth/callback',
        },
      });
      return { error: error ? error.message : null };
    }

    // Local fallback demo mode
    localStorage.setItem('ratingpulse_demo_auth', 'true');
    setUser(mockDemoUser);
    return { error: null };
  };

  const resetPasswordForEmail = async (email: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://ratingpulse.co/reset-password',
      });
      setIsLoading(false);
      return { error: error ? error.message : null };
    }

    // Local fallback demo mode
    setIsLoading(false);
    return { error: null };
  };

  const updateUserPassword = async (password: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      setIsLoading(false);
      return { error: error ? error.message : null };
    }

    // Local fallback demo mode
    setIsLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('ratingpulse_demo_auth');
    setUser(null);
    setSession(null);
    setIsLoading(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPasswordForEmail,
        updateUserPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
