'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
}

interface JWTPayload {
  sub?: string;
  email?: string;
  nameid?: string;
  unique_name?: string;
  [key: string]: any;
}

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Extract user info from JWT token
  const extractUserFromToken = (jwtToken: string): User | null => {
    try {
      const decoded = jwtDecode<JWTPayload>(jwtToken);
      
      // Different JWT implementations use different claim names
      const userId = decoded.sub || decoded.nameid || decoded.id || '';
      const userEmail = decoded.email || decoded.unique_name || '';

      if (userId || userEmail) {
        return {
          id: userId,
          email: userEmail
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  };

  // Login function
  const login = (newToken: string) => {
    try {
      // Extract user information from token
      const userData = extractUserFromToken(newToken);
      
      if (!userData) {
        throw new Error('Invalid token: unable to extract user data');
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', newToken);
      
      // Store token in cookie for server-side middleware
      Cookies.set('auth_token', newToken, { 
        expires: 7, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // Update state
      setToken(newToken);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    
    // Clear cookie
    Cookies.remove('auth_token');
    
    // Reset state
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    
    // Redirect to login page
    router.push('/login');
  };

  // Auto-login effect on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedToken) {
      try {
        const userData = extractUserFromToken(storedToken);
        
        if (userData) {
          setToken(storedToken);
          setUser(userData);
          setIsLoggedIn(true);
        } else {
          // Invalid token, clean up
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const value: AuthContextType = {
    isLoggedIn,
    token,
    user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
