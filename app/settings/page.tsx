"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  User, Palette, Lock, Bell, Trash2, Camera,
  Check, Loader2, Eye, EyeOff, AlertTriangle
} from "lucide-react";

const supabase = createClient();

const THEMES = [
  {
    id: "dark",
    label: "Dark",
    description: "Classic black",
    preview: "bg-zinc-950 border-zinc-800",
    dot: "bg-zinc-700",
  },
  {
    id: "glass",
    label: "Glass",
    description: "Frosted blur",
    preview: "bg-zinc-900/40 backdrop-blur border-white/10",
    dot: "bg-white/30",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep blue-black",
    preview: "bg-[#0a0a1a] border-blue-900/40",
    dot: "bg-blue-700",
  },
];

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "password", label: "Password", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState("dark");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  // Notifications
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifReleases, setNotifReleases] = useState(true);

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    setUser(authUser);

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (prof) {
      setProfile(prof);
      setUsername(prof.username || "");
      setBio(prof.bio || "");
      setAvatarUrl(prof.avatar_url || null);
      setTheme(prof.theme || "dark");
    }
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    setAvatarUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setAvatarUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
    setAvatarUrl(urlWithCacheBust);

    await supabase.from("profiles").update({ avatar_url: urlWithCacheBust }).eq("id", user.id);
    setAvatarUploading(false);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);

    await supabase.from("profiles").update({
      username,
      bio,
      avatar_url: avatarUrl,
      theme,
    }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveTheme(selectedTheme: string) {
    setTheme(selectedTheme);
    if (!user) return;
    await supabase.from("profiles").update({ theme: selectedTheme }).eq("id", user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function changePassword() {
    setPassError("");
    if (newPassword !== confirmPassword) { setPassError("Passwords don't match"); return; }
    if (newPassword.length < 6) { setPassError("Password must be at least 6 characters"); return; }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPassError(error.message); return; }

    setPassSaved(true);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setPassSaved(false), 2500);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    // Sign out — actual deletion requires server-side admin call
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-white">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-10">Settings</h1>

      <div className="flex gap-8">
        {/* Tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-tight transition-all ${
                  isActive
                    ? "bg-orange-500/10 text-orange-500 border-r-4 border-orange-500 rounded-r-none"
                    : t.id === "danger"
                      ? "text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-2xl p-8">

          {/* PROFILE TAB */}
          {tab === "profile" && (
            <div className="space-y-8">
              <h2 className="text-xl font-black uppercase tracking-tight">Profile</h2>

              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarUploading ? (
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Loader2 className="animate-spin text-orange-500" size={24} />
                    </div>
                  ) : avatarUrl ? (
                    <img src={avatarUrl} className="w-20 h-20 rounded-full object-cover border-2 border-orange-500" alt="avatar" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center font-black text-black text-2xl">
                      {username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1.5 text-black hover:bg-orange-600 transition-all"
                  >
                    <Camera size={12} />
                  </button>
                </div>
                <div>
                  <p className="font-bold text-sm">{username || user?.email}</p>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs text-orange-500 font-bold hover:underline"
                  >
                    Change photo
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar(file);
                  }}
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Display Name</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name..."
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500 resize-none"
                />
              </div>

              {/* Email (read only) */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Email</label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 outline-none text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-8 py-3 rounded-xl font-black uppercase text-black text-sm flex items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
                {saved ? "Saved!" : saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}

          {/* THEME TAB */}
          {tab === "theme" && (
            <div className="space-y-8">
              <h2 className="text-xl font-black uppercase tracking-tight">Theme</h2>
              <p className="text-zinc-500 text-sm">Choose your preferred look. Changes apply instantly.</p>

              <div className="grid grid-cols-3 gap-4">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => saveTheme(t.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all ${
                      theme === t.id
                        ? "border-orange-500 scale-[1.02]"
                        : "border-white/10 hover:border-white/30"
                    } ${t.preview}`}
                  >
                    {theme === t.id && (
                      <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-0.5">
                        <Check size={10} className="text-black" />
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-full mb-3 ${t.dot}`} />
                    <p className="font-black text-sm uppercase">{t.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>

              {saved && (
                <p className="text-green-500 text-sm font-bold flex items-center gap-2">
                  <Check size={14} /> Theme Applied!
                </p>
              )}
            </div>
          )}

          {/* PASSWORD TAB */}
          {tab === "password" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight">Change Password</h2>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password..."
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500 pr-12"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">Confirm Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500"
                />
              </div>

              {passError && (
                <p className="text-red-500 text-sm font-bold">{passError}</p>
              )}

              <button
                onClick={changePassword}
                className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-xl font-black uppercase text-black text-sm flex items-center gap-2"
              >
                {passSaved ? <><Check size={16} /> Saved!</> : "Update Password"}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight">Notifications</h2>

              {[
                { label: "New messages", desc: "Get notified when someone messages you", value: notifMessages, set: setNotifMessages },
                { label: "New releases", desc: "Get notified when artists you follow drop music", value: notifReleases, set: setNotifReleases },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`w-12 h-6 rounded-full transition-all relative ${item.value ? "bg-orange-500" : "bg-zinc-700"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.value ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              ))}

              <p className="text-zinc-600 text-xs">Enanble browser permission.</p>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {tab === "danger" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-red-500">Delete Account</h2>

              <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-500 shrink-0" size={20} />
                  <div>
                    <p className="font-black text-sm uppercase text-red-400">Delete Account</p>
                    <p className="text-zinc-500 text-xs mt-0.5">This is permanent. All your data will be lost.</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                    Type <span className="text-red-500">DELETE</span> to confirm
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-zinc-800 border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-600"
                  />
                </div>

                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== "DELETE" || deleting}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-black uppercase text-white text-sm flex items-center gap-2"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {deleting ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}