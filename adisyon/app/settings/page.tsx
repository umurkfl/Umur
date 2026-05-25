"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon, Monitor, Globe, Users, ChevronRight, Check, LogOut, KeyRound, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store, deriveUsername } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Theme = "light" | "dark" | "system";
type Privacy = "public" | "friends";

function applyTheme(t: Theme) {
  try {
    localStorage.setItem("adisyon_theme", t);
    const isDark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch { /* ignore */ }
}

function SectionHeader({ title }: { title: string }) {
  return <p className="text-xs font-semibold text-muted uppercase tracking-wide px-4 pt-5 pb-1.5">{title}</p>;
}

function SettingRow({ icon: Icon, label, value, onClick, danger }: {
  icon: React.ElementType; label: string; value?: string;
  onClick?: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 bg-surface border-b border-border/50 last:border-0 active:opacity-70 transition-opacity text-left ${danger ? "text-red-500" : ""}`}
    >
      <Icon className={`w-4.5 h-4.5 shrink-0 ${danger ? "text-red-500" : "text-muted"}`} />
      <span className={`flex-1 text-sm ${danger ? "font-semibold" : "text-ink"}`}>{label}</span>
      {value && <span className="text-xs text-muted">{value}</span>}
      {onClick && !danger && <ChevronRight className="w-4 h-4 text-border shrink-0" />}
    </button>
  );
}

function EditField({ label, value, onSave, placeholder, type = "text" }: {
  label: string; value: string; onSave: (v: string) => Promise<void>;
  placeholder?: string; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  async function save() {
    if (!val.trim() || val.trim() === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(val.trim());
    setSaving(false);
    setOk(true);
    setTimeout(() => { setOk(false); setEditing(false); }, 1000);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 bg-surface border-b border-border/50">
        <span className="text-xs text-muted w-28 shrink-0">{label}</span>
        <span className="flex-1 text-sm text-ink truncate">{value || <span className="text-muted italic">Belirtilmemiş</span>}</span>
        <button onClick={() => { setVal(value); setEditing(true); }} className="text-xs text-primary font-semibold">Düzenle</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-border/50">
      <input
        autoFocus
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder={placeholder}
        className="flex-1 text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button onClick={save} disabled={saving} className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
        {ok ? <Check className="w-4 h-4 text-white" /> : saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4 text-white" />}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-muted">İptal</button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, login, logout } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("system");
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySaveMsg, setPrivacySaveMsg] = useState("");
  const [showName, setShowNameState] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    try { setTheme((localStorage.getItem("adisyon_theme") as Theme) || "system"); } catch { /* ignore */ }
    if (user) {
      store.getUserPrivacy(user.id).then(setPrivacy);
      setShowNameState(store.getShowName(user.id));
    }
  }, [user]);

  async function changeTheme(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  async function changePrivacy(p: Privacy) {
    if (!user) return;
    setPrivacy(p);
    setPrivacySaving(true);
    setPrivacySaveMsg("");
    await store.setPrivacy(user.id, p);
    setPrivacySaveMsg("✓ Kaydedildi");
    setTimeout(() => setPrivacySaveMsg(""), 2000);
    setPrivacySaving(false);
  }

  function toggleShowName() {
    if (!user) return;
    const next = !showName;
    setShowNameState(next);
    store.setShowName(user.id, next);
  }

  async function saveName(name: string) {
    if (!user) return;
    if (supabase) {
      await supabase.auth.updateUser({ data: { name } });
    }
    await store.updateDisplayName(user.id, name);
    login({ ...user, name });
  }

  async function saveUsername(raw: string) {
    if (!user) return;
    const clean = raw.startsWith("@") ? raw.slice(1) : raw;
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) return;
    const username = "@" + clean;
    store.setUsername(user.id, username);
    if (supabase) {
      await supabase.auth.updateUser({ data: { username } });
    }
    login({ ...user, username });
  }

  async function changePassword() {
    if (!supabase || !newPassword) return;
    if (newPassword.length < 6) { setPasswordMsg("En az 6 karakter olmalı"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordMsg("Hata: " + error.message); }
    else { setPasswordMsg("Şifre güncellendi ✓"); setNewPassword(""); setTimeout(() => { setShowPasswordForm(false); setPasswordMsg(""); }, 1500); }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
        <p className="text-muted">Ayarlara erişmek için giriş yapmalısın.</p>
        <Link href="/auth" className="bg-primary text-white font-bold rounded-full px-6 py-3 text-sm">Giriş Yap</Link>
      </div>
    );
  }

  const displayUsername = user.username ?? deriveUsername(user.name, user.id);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border">
          <ArrowLeft className="w-4 h-4 text-ink" />
        </Link>
        <h1 className="font-bold text-charcoal text-lg">Ayarlar</h1>
      </div>

      {/* Profile preview */}
      <div className="mx-4 my-3 bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
        <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center text-xl font-bold text-primary shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-charcoal">{showName ? user.name : displayUsername}</p>
          <p className="text-xs text-muted">{displayUsername}</p>
        </div>
      </div>

      {/* ── Hesabım ── */}
      <SectionHeader title="Hesabım" />
      <div className="mx-4 rounded-2xl overflow-hidden border border-border">
        <EditField
          label="Görünen Ad"
          value={user.name}
          onSave={saveName}
          placeholder="Adın..."
        />
        <EditField
          label="Kullanıcı Adı"
          value={displayUsername.startsWith("@") ? displayUsername.slice(1) : displayUsername}
          onSave={saveUsername}
          placeholder="kullanici_adi"
        />
        {/* Password change — email users only */}
        {user.provider === "email" && (
          <div>
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-surface active:opacity-70 text-left"
              >
                <KeyRound className="w-4 h-4 text-muted shrink-0" />
                <span className="flex-1 text-sm text-ink">Şifre Değiştir</span>
                <ChevronRight className="w-4 h-4 text-border" />
              </button>
            ) : (
              <div className="px-4 py-3 bg-surface space-y-2">
                <p className="text-xs font-semibold text-muted">Yeni Şifre</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {passwordMsg && <p className={`text-xs ${passwordMsg.includes("✓") ? "text-primary" : "text-red-500"}`}>{passwordMsg}</p>}
                <div className="flex gap-2">
                  <button onClick={changePassword} className="flex-1 py-2 bg-primary text-white text-sm font-semibold rounded-xl">Kaydet</button>
                  <button onClick={() => { setShowPasswordForm(false); setPasswordMsg(""); setNewPassword(""); }} className="px-4 py-2 border border-border text-sm text-muted rounded-xl">İptal</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Görünüm ── */}
      <SectionHeader title="Görünüm" />
      <div className="mx-4 rounded-2xl overflow-hidden border border-border bg-surface">
        <div className="px-4 py-3.5">
          <p className="text-sm text-ink mb-3">Tema</p>
          <div className="flex gap-2">
            {([
              { value: "light", icon: Sun, label: "Açık" },
              { value: "dark", icon: Moon, label: "Koyu" },
              { value: "system", icon: Monitor, label: "Sistem" },
            ] as { value: Theme; icon: React.ElementType; label: string }[]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => changeTheme(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                  theme === value
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border text-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gizlilik ── */}
      <SectionHeader title="Gizlilik" />
      <div className="mx-4 rounded-2xl overflow-hidden border border-border bg-surface">
        <div className="px-4 py-3.5">
          <div className="flex items-start gap-3 mb-4">
            {privacy === "public"
              ? <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              : <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            }
            <div>
              <p className="text-sm font-semibold text-ink">
                {privacy === "public" ? "Herkese Açık Profil" : "Gizli Profil"}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {privacy === "public"
                  ? "Adisyonlarını ve aktiviteni herkes görebilir."
                  : "Profilini ve adisyonlarını yalnızca karşılıklı arkadaşların görebilir."
                }
              </p>
            </div>
            {privacySaving
              ? <span className="text-[10px] text-muted shrink-0">Kaydediliyor…</span>
              : privacySaveMsg && <span className={`text-[10px] shrink-0 ${privacySaveMsg.startsWith("⚠️") ? "text-red-500" : "text-primary"}`}>{privacySaveMsg}</span>
            }
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changePrivacy("public")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all ${
                privacy === "public" ? "border-primary bg-primary-light text-primary" : "border-border text-muted"
              }`}
            >
              <Globe className="w-4 h-4" /> Herkese Açık
            </button>
            <button
              onClick={() => changePrivacy("friends")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all ${
                privacy === "friends" ? "border-primary bg-primary-light text-primary" : "border-border text-muted"
              }`}
            >
              <Users className="w-4 h-4" /> Sadece Arkadaşlar
            </button>
          </div>
        </div>

        {/* Anonymity toggle */}
        <div className="border-t border-border/50 px-4 py-3.5 flex items-center gap-3">
          <EyeOff className="w-5 h-5 text-muted shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-ink font-medium">Anonim Mod</p>
            <p className="text-xs text-muted mt-0.5">Gerçek ismin yerine kullanıcı adın görünsün</p>
          </div>
          <button
            onClick={toggleShowName}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${!showName ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${!showName ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
          </button>
        </div>
      </div>

      {/* ── Hesap Yönetimi ── */}
      <SectionHeader title="Hesap" />
      <div className="mx-4 rounded-2xl overflow-hidden border border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-surface active:opacity-70 text-left"
        >
          <LogOut className="w-4 h-4 text-red-500 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-red-500">Çıkış Yap</span>
        </button>
      </div>

      <p className="text-center text-[10px] text-muted mt-6 mb-2">grazer · Gerçek Restoran Fiyatları</p>
    </div>
  );
}
