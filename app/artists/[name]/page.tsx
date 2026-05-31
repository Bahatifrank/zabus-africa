"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePlayerStore } from "@/app/store/usePlayerStore";
import { Play, Loader2 } from "lucide-react";

// Move this OUTSIDE the component to stop the infinite loop/rebuilding
const supabase = createClient();

export default function ArtistProfilePage() {
  const { name } = useParams();
  const artistName = decodeURIComponent(name as string || "");

  const { setCurrentSong } = usePlayerStore();
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSongs() {
      if (!artistName) return;
      setLoading(true);

      // Use .ilike for case-insensitive matching
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .ilike("artist_name", artistName)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error:", error.message);
      } else {
        setSongs(data || []);
      }
      setLoading(false);
    }

    fetchSongs();
  }, [artistName]); // Only re-run if the name in the URL changes

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="text-orange-500 animate-spin mb-4" size={48} />
        <p className="text-orange-500 font-black uppercase text-xs tracking-widest">
          Assembling {artistName}…
        </p>
      </div>
    );
  }

  // If we found no songs, let the user know instead of showing an empty screen
  if (songs.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-20 text-white">
        <h2 className="text-2xl font-black uppercase italic">No Tracks Found</h2>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest">
          Check if "{artistName}" matches your database records.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white min-h-screen bg-black">
      <h1 className="text-5xl font-black uppercase mb-12 italic tracking-tighter">
        {artistName}
      </h1>

      <div className="space-y-2">
        {songs.map((song, i) => (
          <div
            key={song.id}
            onClick={() => setCurrentSong(song, songs)}
            className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl cursor-pointer group transition-all"
          >
            <span className="text-zinc-600 font-bold w-6">{i + 1}</span>
            <img src={song.cover_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
            <div className="flex-1">
              <p className="font-bold group-hover:text-orange-500 transition-colors">{song.title}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{song.artist_name}</p>
            </div>
            <Play className="text-zinc-600 group-hover:text-orange-500" size={20} />
          </div>
        ))}
      </div>
    </div>
  );
}