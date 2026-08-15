"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  User,
  Palette,
  Lock,
  Bell,
  Trash2,
  Camera,
  Check,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const supabase = createClient();

const THEMES = [
  { id: "dark", label: "Dark", description: "Classic black", dot: "bg-zinc-700" },
  { id: "glass", label: "Glass", description: "Frosted blur", dot: "bg-white/30" },
  { id: "midnight", label: "Midnight", description: "Deep blue-black", dot: "bg-blue-700" },
];

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "password", label: "Password", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState("dark");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  const [notifMessages, setNotifMessages] = useState(true);
  const [notifReleases, setNotifReleases] = useState(true);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    loadProfile();
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !isMobile && tab === null) {
      setTab("profile");
    }
  }, [hasMounted, isMobile, tab]);

  async function loadProfile() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;
    setUser(authUser);

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (prof) {
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

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });

    if (error) {
      alert("Upload failed: " + error.message);
      setAvatarUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const url = `${publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);

    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setAvatarUploading(false);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ username, bio, avatar_url: avatarUrl, theme })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveTheme(t: string) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);

    if (user) {
      await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function changePassword() {
    setPassError("");

    if (newPassword !== confirmPassword) {
      setPassError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Minimum 6 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPassError(error.message);
      return;
    }

    setPassSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPassSaved(false), 2500);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const activeTab = TABS.find((t) => t.id === tab);
  const showSidebar = !isMobile || tab === null;
  const showContent = tab !== null;
  const headerLabel = isMobile && tab !== null ? activeTab?.label ?? "Settings" : "Settings";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 text-white">
      <div className="flex items-center gap-3 mb-6">
        {isMobile && tab !== null && (
          <button
            onClick={() => setTab(null)}
            className="text-zinc-400 hover:text-white p-1 shrink-0"
            aria-label="Back to settings menu"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
          {headerLabel}
        </h1>
      </div>

      <div className="flex gap-6 items-start">
        {showSidebar && (
          <div className="flex flex-col w-full md:w-52 shrink-0 gap-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-between gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-tight transition-all text-left ${
                    isActive
                      ? "bg-orange-500/10 text-orange-500 border-r-4 border-orange-500 rounded-r-none"
                      : t.id === "danger"
                      ? "text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="shrink-0" />
                    <span>{t.label}</span>
                  </div>
                  <ChevronRight size={16} className="md:hidden text-zinc-600" />
                </button>
              );
            })}
          </div>
        )}

        {showContent && (
          <div className="flex-1 w-full min-w-0 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-8">
            {tab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase hidden md:block">Profile</h2>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {avatarUploading ? (
                      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Loader2 className="animate-spin text-orange-500" size={24} />
                      </div>
                    ) : avatarUrl ? (
                      <img
                        src={avatarUrl}
                        className="w-20 h-20 rounded-full object-cover border-2 border-orange-500"
                        alt="Avatar"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center font-black text-black text-2xl">
                        {username?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase() ||
                          "?"}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1.5 text-black hover:bg-orange-600"
                    >
                      <Camera size={14} />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold truncate">{username || user?.email}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-orange-500 font-bold hover:underline mt-1 block"
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
                      const f = e.target.files?.[0];
                      if (f) uploadAvatar(f);
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                    Display Name
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people about yourself..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                    Email
                  </label>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-xl font-black uppercase text-black text-sm flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : saved ? (
                    <Check size={16} />
                  ) : null}
                  {saved ? "Saved!" : saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            )}

            {tab === "theme" && (
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase hidden md:block">Theme</h2>
                <p className="text-zinc-400 text-sm">Changes apply instantly across the app.</p>

                <div className="grid grid-cols-1 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => saveTheme(t.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        theme === t.id
                          ? "border-orange-500 bg-orange-500/5"
                          : "border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full border border-white/10 shrink-0 ${t.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm uppercase">{t.label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{t.description}</p>
                      </div>
                      {theme === t.id && <Check size={18} className="text-orange-500 shrink-0" />}
                    </button>
                  ))}
                </div>

                {saved && (
                  <p className="text-green-500 text-sm font-bold flex items-center gap-2">
                    <Check size={14} /> Theme saved!
                  </p>
                )}
              </div>
            )}

            {tab === "password" && (
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase hidden md:block">Change Password</h2>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                    Confirm Password
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-500"
                  />
                </div>

                {passError && <p className="text-red-500 text-sm font-bold">{passError}</p>}

                <button
                  onClick={changePassword}
                  className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl font-black uppercase text-black text-sm flex items-center justify-center gap-2"
                >
                  {passSaved ? (
                    <>
                      <Check size={16} /> Updated!
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            )}

            {tab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase hidden md:block">Notifications</h2>

                {[
                  {
                    label: "Direct Messages",
                    desc: "Get notified when someone messages you",
                    value: notifMessages,
                    set: setNotifMessages,
                  },
                  {
                    label: "New Releases",
                    desc: "Get updates when artists drop new music",
                    value: notifReleases,
                    set: setNotifReleases,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 bg-zinc-800/40 rounded-xl border border-zinc-800 gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-zinc-400 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.set(!item.value)}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                        item.value ? "bg-orange-500" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          item.value ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === "danger" && (
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase text-red-500 hidden md:block">
                  Danger Zone
                </h2>

                <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-sm text-red-400 uppercase">Delete Account</p>
                      <p className="text-zinc-400 text-xs mt-1">
                        This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">
                      Type <span className="text-red-500">DELETE</span> to confirm
                    </label>
                    <input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE"
                      className="w-full bg-zinc-900 border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-3 outline-none text-sm text-white placeholder-zinc-600"
                    />
                  </div>

                  <button
                    onClick={deleteAccount}
                    disabled={deleteConfirm !== "DELETE" || deleting}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 py-3 rounded-xl font-black uppercase text-white text-sm flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    {deleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}