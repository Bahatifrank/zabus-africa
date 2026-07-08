"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Upload, Music, Film, CheckCircle, Loader2, Image as ImageIcon, ChevronDown } from "lucide-react";

// UPDATED: Comprehensive list to match the HomePage filters
const GENRES = [
  "Afrobeats", 
  "Afropop", 
  "Bongo Flava", 
  "Hip Hop & Rap", 
  "Drill", 
  "Gospel", 
  "Amapiano",  
  "Dancehall", 
  "Reggae", 
  "R&B", 
  "Pop", 
  "Traditional", 
  "Highlife"
];

export default function ArtistUpload() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  // Defaulting to Afrobeats as it's the first in our new list
  const [selectedGenre, setSelectedGenre] = useState("Afrobeats");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("Uploading files...");

    const formData = new FormData(e.currentTarget);

    const mediaFile = formData.get("media") as File;
    const coverFile = formData.get("cover") as File;
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;

    try {
      // Get the logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to upload music.");
      }

      // Detect media type
      const isVideo = mediaFile.type.startsWith("video/");
      const detectedType = isVideo ? "video" : "audio";

      // Upload media file
      const mediaExt = mediaFile.name.split(".").pop();
      const mediaName = `${Date.now()}-track.${mediaExt}`;

      const { data: mData, error: mErr } = await supabase.storage
        .from("media")
        .upload(`tracks/${mediaName}`, mediaFile);

      if (mErr) throw mErr;

      // Upload cover
      const coverExt = coverFile.name.split(".").pop();
      const coverName = `${Date.now()}-cover.${coverExt}`;

      const { data: cData, error: cErr } = await supabase.storage
        .from("media")
        .upload(`covers/${coverName}`, coverFile);

      if (cErr) throw cErr;

      // Get public URLs
      const mediaUrl = supabase.storage
        .from("media")
        .getPublicUrl(mData.path).data.publicUrl;

      const coverUrl = supabase.storage
        .from("media")
        .getPublicUrl(cData.path).data.publicUrl;

      // Save song to database
      const { error: dbErr } = await supabase.from("songs").insert({
        title,
        artist_name: artist,
        genre: selectedGenre,
        media_url: mediaUrl,
        cover_url: coverUrl,
        media_type: detectedType,
        status: "pending",
        user_id: user.id, // ✅ IMPORTANT
      });

      if (dbErr) throw dbErr;

      setStatus("Success! Your track is pending admin approval.");

      // Reset form
      (e.target as HTMLFormElement).reset();
      setSelectedGenre("Afrobeats");

    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-[#121212] p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
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

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* GENRE SELECTOR - STADIUM UI STYLE */}
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
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-white disabled:bg-zinc-800 text-black font-black py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 tracking-[0.2em] text-xs shadow-xl shadow-orange-500/10"
          >
            {loading ? <Loader2 className="animate-spin" /> : "PUBLISH TO ZABUS"}
          </button>

          {status && (
            <div className={`p-5 rounded-2xl text-[10px] font-black tracking-widest uppercase text-center border animate-in fade-in slide-in-from-top-2 ${
              status.includes("Error") 
              ? "bg-red-500/5 border-red-500/20 text-red-500" 
              : "bg-green-500/5 border-green-500/20 text-green-500"
            }`}>
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}