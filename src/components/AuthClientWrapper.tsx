'use client';

import { AuthProvider } from '@/src/context/AuthContext';
import type { ReactNode } from 'react';

interface AuthClientWrapperProps {
  children: ReactNode;
}

/**
 * Client Component wrapper for AuthProvider
 * This allows the Server Component layout.tsx to properly wrap children
 * with the AuthProvider without violating React Server Component rules
 */
export function AuthClientWrapper({ children }: AuthClientWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
