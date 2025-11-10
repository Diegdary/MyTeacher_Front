"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  logout: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  // Validate session and attempt refresh if needed (best-effort)
  useEffect(() => {
    let cancelled = false;

    const mergeUser = (incoming: any) => {
      try {
        const current = JSON.parse(localStorage.getItem("user") || "null");
        const merged = current ? { ...current, ...incoming } : incoming;
        localStorage.setItem("user", JSON.stringify(merged));
        if (!cancelled) setUser(merged);
      } catch {
        if (!cancelled) setUser(incoming);
      }
    };

    const tryRefresh = async (): Promise<boolean> => {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) return false;
      const candidates = [
        `${API_BASE}/token/refresh/`,
        `${API_BASE}/refresh/`,
        `${API_BASE}/jwt/refresh/`,
      ];
      for (const url of candidates) {
        try {
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          });
          if (r.ok) {
            const data = await r.json();
            const newAccess = data?.access || data?.access_token;
            if (newAccess) {
              localStorage.setItem("access", newAccess);
              return true;
            }
          }
        } catch {}
      }
      return false;
    };

    const fetchMe = async () => {
      const access = localStorage.getItem("access");
      if (!access) return; // keep last known user until next auth action
      try {
        const res = await fetch(`${API_BASE}/me/`, { headers: { Authorization: `Bearer ${access}` } });
        if (res.ok) {
          mergeUser(await res.json());
          return;
        }
        if (res.status === 401 || res.status === 403) {
          const refreshed = await tryRefresh();
          if (refreshed) {
            const res2 = await fetch(`${API_BASE}/me/`, { headers: { Authorization: `Bearer ${localStorage.getItem("access")}` } });
            if (res2.ok) mergeUser(await res2.json());
            else safeLogout();
          } else {
            safeLogout();
          }
        }
      } catch {}
    };

    const safeLogout = () => {
      try {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
      } catch {}
      if (!cancelled) setUser(null);
    };

    fetchMe();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "user" && e.newValue) {
        try { setUser(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === "access" && !e.newValue) setUser(null);
    };
    window.addEventListener("storage", onStorage);
    return () => { cancelled = true; window.removeEventListener("storage", onStorage); };
  }, []);

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
    // Redirigir siempre al landing
    try { router.push("/"); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
