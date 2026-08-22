"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { syncStreakFromServer } from "@/lib/streak";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  xp?: number;
  level?: string;
  reelsWatched?: number;
  streak?: {
    current: number;
    longest: number;
  };
  activityHistory?: {
    date: string;
    xpEarned: number;
    reelsWatched: number;
  }[];
  preferences?: {
    darkMode?: boolean;
    [key: string]: any;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on initial load
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  // Global Dark Mode side-effect
  useEffect(() => {
    if (user?.preferences?.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [user?.preferences?.darkMode]);

  const login = (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    syncStreakFromServer(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const refreshUser = async () => {
    try {
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        syncStreakFromServer(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
