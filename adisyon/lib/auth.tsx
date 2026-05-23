"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { StoredUser, store } from "./store";

interface AuthCtx {
  user: StoredUser | null;
  login: (u: StoredUser) => void;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, login: () => {}, logout: () => {}, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(store.getCurrentUser());
    setReady(true);
  }, []);

  function login(u: StoredUser) {
    store.setCurrentUser(u);
    setUser(u);
  }

  function logout() {
    store.setCurrentUser(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, login, logout, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
