"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { StoredUser, store } from "./store";

interface AuthCtx {
  user: StoredUser | null;
  login: (u: StoredUser) => void;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, login: () => {}, logout: () => {}, ready: false });

// Avatar stays in localStorage (base64 is too large for Supabase user_metadata)
function readAvatar(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(`adisyon_avatar_${userId}`); } catch { return null; }
}

function toStoredUser(u: User): StoredUser {
  const meta = u.user_metadata ?? {};
  const provider = u.app_metadata?.provider === "google" ? "google" : "email";
  const name = meta.name || meta.full_name || u.email?.split("@")[0] || "Kullanıcı";
  const storedUsername = typeof window !== "undefined"
    ? (localStorage.getItem(`adisyon_username_${u.id}`) ?? (meta.username as string | undefined) ?? undefined)
    : (meta.username as string | undefined) ?? undefined;
  return {
    id: u.id,
    email: u.email ?? "",
    name,
    avatar: readAvatar(u.id) ?? (meta.avatar_url as string | null) ?? null,
    provider: provider as "email" | "google",
    createdAt: u.created_at ?? new Date().toISOString(),
    username: storedUsername,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // No Supabase configured — fall back to localStorage auth
      setUser(store.getCurrentUser());
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? toStoredUser(session.user) : null);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toStoredUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function login(u: StoredUser) {
    // Used to update in-memory user (e.g. after avatar change)
    if (!supabase) store.setCurrentUser(u);
    setUser(u);
  }

  function logout() {
    if (supabase) {
      supabase.auth.signOut();
    } else {
      store.setCurrentUser(null);
    }
    setUser(null);
  }

  return <Ctx.Provider value={{ user, login, logout, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
