"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Play, Flame, Clock, barChart as Chart } from "lucide-react";
import { usePlayerStore } from "@/app/store/usePlayerStore";

export default function TrendingPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const { setCurrentSong, setPlaying } = usePlayerStore();
  const supabase = createClient();

  useEffect(() => {
    const fetchTrending = async () => {
      const { data } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false }) // Replace with play_count if available
        .limit(20);
      if (data) setSongs(data);
    };
    fetchTrending();
  }, [supabase]);

  return (
    <div className="p-8 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-600 rounded-2xl shadow-[0_0_20px_rgba(234,88,12,0.3)]">
          <Flame className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Trending Now</h1>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">The hottest sounds in Africa right now</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {songs.map((song, index) => (
          <div 
            key={song.id}
            onClick={() => { setCurrentSong(song); setPlaying(true); }}
            className="group relative bg-zinc-900/40 border border-white/5 p-4 rounded-3xl hover:bg-zinc-800/60 transition-all cursor-pointer"
          >
            <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl">
              <img src={song.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-orange-600 p-4 rounded-full scale-75 group-hover:scale-100 transition-transform">
                  <Play fill="white" className="text-white ml-1" />
                </div>
              </div>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-orange-500 font-black text-xs"># {index + 1}</span>
              </div>
            </div>
            <h3 className="text-white font-bold truncate uppercase italic tracking-tight">{song.title}</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{song.artist_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}