"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { store } from "@/lib/store";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-posta veya şifre hatalı";
  if (msg.includes("Email not confirmed")) return "E-postanı doğrula, ardından giriş yap";
  if (msg.includes("User already registered")) return "Bu e-posta zaten kayıtlı, giriş yap";
  if (msg.includes("Password should be at least")) return "Şifre en az 6 karakter olmalı";
  if (msg.includes("Unable to validate email")) return "Geçerli bir e-posta gir";
  return "Bir hata oluştu, tekrar dene";
}

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // --- Supabase auth ---
    if (supabase) {
      setLoading(true);
      try {
        if (tab === "register") {
          if (!name.trim()) { setError("İsim gerekli"); return; }
          const { data, error: err } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { name: name.trim() } },
          });
          if (err) { setError(translateError(err.message)); return; }
          // If email confirmation required, session will be null
          if (!data.session) { setConfirmSent(true); return; }
        } else {
          const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (err) { setError(translateError(err.message)); return; }
        }
        // onAuthStateChange in AuthProvider will update user state
        router.push("/");
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- localStorage fallback (no Supabase) ---
    if (tab === "register") {
      if (!name.trim()) { setError("İsim gerekli"); return; }
      if (!email.includes("@")) { setError("Geçerli bir e-posta gir"); return; }
      if (store.findUserByEmail(email)) { setError("Bu e-posta zaten kayıtlı"); return; }
      const user = { id: crypto.randomUUID(), name: name.trim(), email: email.toLowerCase().trim(), avatar: null, provider: "email" as const, createdAt: new Date().toISOString() };
      store.createUser(user);
      login(user);
    } else {
      const user = store.findUserByEmail(email);
      if (!user) { setError("Bu e-posta ile kayıtlı kullanıcı bulunamadı"); return; }
      login(user);
    }
    router.push("/");
  }

  async function handleGoogle() {
    if (!supabase) { setError("Google girişi için Supabase gerekli"); return; }
    setLoading(true);
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname.startsWith("/Umur") ? "/Umur" : ""}/`
      : undefined;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (err) { setError(translateError(err.message)); setLoading(false); }
    // On success the browser redirects away — no need to handle further
  }

  if (confirmSent) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">E-postanı doğrula</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          <strong>{email}</strong> adresine doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
        </p>
        <button onClick={() => setConfirmSent(false)} className="text-sm text-orange-500 font-semibold">
          ← Geri dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center space-y-6 max-w-sm mx-auto">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-400 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfa
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Adisyon</h1>
        <p className="text-sm text-gray-500 mt-1">Topluluğa katıl, deneyimini paylaş</p>
      </div>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-3.5 text-sm font-semibold text-gray-700 shadow-sm active:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <GoogleIcon />
        Google ile devam et
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">veya</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1">
        {(["login", "register"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            {t === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {tab === "register" && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Adın Soyadın" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="email" placeholder="E-posta adresin" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="password" placeholder={tab === "register" ? "Şifre (en az 6 karakter)" : "Şifre"} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        {error && <p className="text-sm text-red-500 font-medium px-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 disabled:bg-orange-300 text-white font-bold rounded-2xl py-4 text-sm active:bg-orange-600 transition-colors mt-2 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {tab === "login" ? "Giriş Yap" : "Hesap Oluştur"}
        </button>
      </form>
    </div>
  );
}
