"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Home, TrendingUp, Users, Music, Bookmark, Mail, 
  Tv, Upload, Settings, Loader2, LogIn,
  Image as ImageIcon, ChevronDown, X, LayoutDashboard, Menu
  Image as ImageIcon, ChevronDown, X, LayoutDashboard, Menu
} from "lucide-react";

const GENRES = [
  "Afrobeats", "Afropop", "Bongo Flava", "Hip Hop & Rap", "Drill", 
  "Gospel", "Amapiano", "Dancehall", "Reggae", "R&B", "Pop", "Traditional", "Highlife"
];

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Afrobeats");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setIsAdmin(profile?.role === "admin");
      }

      setLoadingUser(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadLoading(true);
    setUploadStatus("Uploading files...");

    const formData = new FormData(e.currentTarget);
    const mediaFile = formData.get("media") as File;
    const coverFile = formData.get("cover") as File;
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to upload music.");

      const isVideo = mediaFile.type.startsWith("video/");
      const detectedType = isVideo ? "video" : "audio";

      const mediaExt = mediaFile.name.split(".").pop();
      const mediaName = `${Date.now()}-track.${mediaExt}`;
      const { data: mData, error: mErr } = await supabase.storage
        .from("media").upload(`tracks/${mediaName}`, mediaFile);
      if (mErr) throw mErr;

      const coverExt = coverFile.name.split(".").pop();
      const coverName = `${Date.now()}-cover.${coverExt}`;
      const { data: cData, error: cErr } = await supabase.storage
        .from("media").upload(`covers/${coverName}`, coverFile);
      if (cErr) throw cErr;

      const mediaUrl = supabase.storage.from("media").getPublicUrl(mData.path).data.publicUrl;
      const coverUrl = supabase.storage.from("media").getPublicUrl(cData.path).data.publicUrl;

      const { error: dbErr } = await supabase.from("songs").insert({
        title, artist_name: artist, genre: selectedGenre,
        media_url: mediaUrl, cover_url: coverUrl,
        media_type: detectedType, status: "pending", user_id: user.id,
      });
      if (dbErr) throw dbErr;

      setUploadStatus("Success! Your track is pending admin approval.");
      (e.target as HTMLFormElement).reset();
      setSelectedGenre("Afrobeats");
    } catch (err: any) {
      console.error(err);
      setUploadStatus("Error: " + err.message);
    } finally {
      setUploadLoading(false);
    }
  }

  const navItems = [
    { name: "HOME", href: "/", icon: Home },
    { name: "TRENDING", href: "/trending", icon: TrendingUp },
    { name: "ARTISTS", href: "/artists", icon: Users },
    { name: "PLAYLISTS", href: "/playlists", icon: Music },
    { name: "BOOKMARKS", href: "/bookmarks", icon: Bookmark },
    { name: "INBOX", href: "/inbox", icon: Mail },
  ];

  const closeMobile = () => setIsOpen(false);

  const closeMobile = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-white/5 flex items-center justify-between px-4 z-40">
        <Link href="/">
          <h1 className="text-orange-500 font-black italic tracking-tighter uppercase text-lg">
            ZABUS-AFRICA
          </h1>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-white p-2 rounded-lg hover:bg-zinc-900 transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={closeMobile}
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        />
      )}

      {/* Responsive Drawer Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-screen w-[82%] max-w-[320px] bg-[#181818] 
          transition-transform duration-300 lg:translate-x-0 lg:static lg:w-[260px] 
          flex flex-col p-6 select-none flex-shrink-0 overflow-y-auto custom-scrollbar
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={closeMobile} className="inline-block relative z-10">
              <h1 className="text-orange-500 font-black italic tracking-tighter uppercase text-xl lg:text-2xl relative !before:content-none !after:content-none [text-shadow:none]">
                ZABUS-AFRICA
              </h1>
            </Link>
            <button 
              onClick={closeMobile}
              className="lg:hidden text-zinc-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobile}
                  onClick={closeMobile}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
                    isActive
                      ? "bg-zinc-900 text-white border border-white/5"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-orange-500" : "text-zinc-400"} />
                  {item.name}
                </Link>
              );
            })}

            <Link
              href="/live-football"
              onClick={closeMobile}
              onClick={closeMobile}
              className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all bg-red-950/20 text-zinc-300 border border-red-500/10 hover:border-red-500/30 group"
            >
              <div className="flex items-center gap-4">
                <Tv size={18} className="text-red-500" />
                <span>LIVE FOOTBALL</span>
              </div>
              <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                LIVE
              </span>
            </Link>

            {!loadingUser && !user && (
              <Link
                href="/login"
                onClick={closeMobile}
                onClick={closeMobile}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
                  pathname === "/login" ? "bg-zinc-900 text-white border border-white/5" : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                <LogIn size={18} className={pathname === "/login" ? "text-orange-500" : "text-zinc-400"} />
                <span>SIGN IN</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-5">
          {loadingUser ? (
            <div className="py-2 flex justify-center">
              <Loader2 className="animate-spin text-orange-500" size={16} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { closeMobile(); setUploadStatus(""); setIsUploadOpen(true); }}
                onClick={() => { closeMobile(); setUploadStatus(""); setIsUploadOpen(true); }}
                className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(249,115,22,0.15)]"
              >
                <Upload size={16} />
                ARTIST UPLOAD
              </button>

              <Link
                href="/settings"
                onClick={closeMobile}
                onClick={closeMobile}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  pathname.startsWith("/settings") ? "bg-zinc-900 text-white border border-white/5" : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                <Settings size={18} className={pathname.startsWith("/settings") ? "text-orange-500" : "text-zinc-400"} />
                SETTINGS
              </Link>

              {/* Admin Panel — only visible to admins */}
              {user && isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={closeMobile}
                  onClick={closeMobile}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    pathname.startsWith("/admin/dashboard") ? "bg-zinc-900 text-white border border-white/5" : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  <LayoutDashboard size={18} className={pathname.startsWith("/admin/dashboard") ? "text-orange-500" : "text-zinc-400"} />
                  ADMIN PANEL
                </Link>
              )}

              {user && (
                <button
                  onClick={() => { closeMobile(); supabase.auth.signOut(); }}
                  onClick={() => { closeMobile(); supabase.auth.signOut(); }}
                  className="text-left text-zinc-600 hover:text-red-400 text-[10px] font-bold tracking-widest uppercase mt-2 px-4 transition-colors"
                >
                  Sign Out Account
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl my-8">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute right-6 top-8 text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-900/50 z-10"
            >
              <X size={20} />
            </button>

            <div className="bg-[#121212] p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl text-left">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-orange-500 rounded-full" />
                  <span className="text-orange-500 font-black uppercase tracking-[0.3em] text-[10px]">Creator Hub</span>
                </div>
                <h1 className="text-4xl font-black text-white italic flex items-center gap-3 tracking-tighter uppercase">
                  <Upload className="text-orange-500" size={32} /> ZABUS STUDIO
                </h1>
                <p className="text-zinc-500 mt-2 text-sm">Upload MP3 audio or MP4 music videos to the platform.</p>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Track Title</label>
                    <input name="title" required className="w-full bg-[#181818] border border-zinc-800 rounded-2xl p-4 outline-none focus:border-orange-500 transition text-white text-sm font-bold placeholder:text-zinc-700" placeholder="e.g. Calm Down" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Artist Name</label>
                    <input name="artist" required className="w-full bg-[#181818] border border-zinc-800 rounded-2xl p-4 outline-none focus:border-orange-500 transition text-white text-sm font-bold placeholder:text-zinc-700" placeholder="Stage Name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Select Category / Genre</label>
                  <div className="relative">
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full bg-[#181818] border border-zinc-800 rounded-2xl p-4 outline-none focus:border-orange-500 transition text-white text-sm font-bold appearance-none cursor-pointer"
                    >
                      {GENRES.map((g) => (
                        <option key={g} value={g} className="bg-[#121212]">{g}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="flex flex-col items-center justify-center h-40 bg-[#181818] rounded-[2rem] border-2 border-dashed border-zinc-800 group-hover:border-orange-500/50 cursor-pointer transition">
                      <div className="bg-orange-500/10 p-3 rounded-full mb-3">
                        <Music className="text-orange-500" size={24} />
                      </div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Audio/Video File</p>
                      <input type="file" name="media" accept="audio/*,video/*" required className="absolute inset-0 opacity-0 cursor-pointer" />
                    </label>
                  </div>
                  <div className="relative group">
                    <label className="flex flex-col items-center justify-center h-40 bg-[#181818] rounded-[2rem] border-2 border-dashed border-zinc-800 group-hover:border-orange-500/50 cursor-pointer transition">
                      <div className="bg-orange-500/10 p-3 rounded-full mb-3">
                        <ImageIcon className="text-orange-500" size={24} />
                      </div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cover Artwork</p>
                      <input type="file" name="cover" accept="image/*" required className="absolute inset-0 opacity-0 cursor-pointer" />
                    </label>
                  </div>
                </div>

                <button
                  disabled={uploadLoading}
                  className="w-full bg-orange-500 hover:bg-white disabled:bg-zinc-800 text-black font-black py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 tracking-[0.2em] text-xs shadow-xl shadow-orange-500/10"
                >
                  {uploadLoading ? <Loader2 className="animate-spin" /> : "PUBLISH TO ZABUS"}
                </button>

                {uploadStatus && (
                  <div className={`p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase text-center border animate-in fade-in slide-in-from-top-2 ${
                    uploadStatus.includes("Error")
                      ? "bg-red-500/5 border-red-500/20 text-red-500"
                      : "bg-green-500/5 border-green-500/20 text-green-500"
                  }`}>
                    {uploadStatus}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
