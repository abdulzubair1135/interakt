"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

type User = {
  id: string;
  _id: string;
  username: string;
  email: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  role: string;
  isPremium?: boolean;
  followers?: any[];
  following?: any[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("campushub_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("https://interakt-api.onrender.com/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.data);
    } catch (err: any) {
      console.error("Failed to fetch user", err);
      // Only logout if it's a 401 error (unauthorized)
      if (err.response?.status === 401) {
        localStorage.removeItem("campushub_token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("campushub_token");
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/register", "/privacy"];
    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/login");
    } else if (user && (pathname === "/login" || pathname === "/register")) {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--accent-purple)] animate-spin"></div>
      </div>
    );
  }

  const publicRoutes = ["/login", "/register", "/privacy"];
  if (!user && !publicRoutes.includes(pathname)) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
