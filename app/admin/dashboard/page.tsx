"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Check, X, Play, Video as VideoIcon, Music, Lock, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pendingSongs, setPendingSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. SECURITY: Immediate Auth Check
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check for specific email OR the 'admin' role metadata
      if (user?.email === "bahatifrank908@gmail.com" || user?.user_metadata?.role === "admin") {
        setIsAdmin(true);
        fetchPendingSongs();
      } else {
        setIsAdmin(false);
        router.push("/"); // Kick non-admins back to the home page
      }
    }
    checkAdmin();
  }, [router, supabase]);

  // 2. DATA: Fetching Pending Tracks
  async function fetchPendingSongs() {
    setLoading(true);
    const { data } = await supabase
      .from("songs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    setPendingSongs(data || []);
    setLoading(false);
  }

  // 3. ACTION: Approve or Reject Tracks
  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("songs")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      // Refresh local list immediately after update
      setPendingSongs(prev => prev.filter(song => song.id !== id));
    }
  }

  if (isAdmin === null) return <div className="bg-black min-h-screen" />;

  return (
    <div className="p-10 bg-black min-h-screen text-white pb-32">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">System Live</span>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">Admin Command</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
               Reviewing {pendingSongs.length} tracks in queue
            </p>
          </div>
          <button 
            onClick={fetchPendingSongs}
            className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* QUEUE LISTING */}
        <div className="space-y-4">
          {loading && pendingSongs.length === 0 ? (
            <div className="py-20 text-center animate-pulse font-black italic text-zinc-700">SCANNING DATABASE...</div>
          ) : pendingSongs.map((song) => (
            <div key={song.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center hover:border-white/10 transition-all">
              
              {/* PREVIEW IMAGE/VIDEO */}
              <div className="w-full md:w-56 aspect-video bg-black rounded-3xl overflow-hidden relative group border border-white/5 shadow-2xl">
                {song.media_type === 'video' ? (
                  <video src={song.media_url} className="w-full h-full object-cover" controls={false} muted />
                ) : (
                  <img src={song.cover_url} className="w-full h-full object-cover opacity-80" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a href={song.media_url} target="_blank" rel="noreferrer" className="text-[10px] bg-white text-black px-6 py-2 rounded-full font-black uppercase tracking-widest">
                    Preview Media
                  </a>
                </div>
              </div>

              {/* SONG INFO */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  {song.media_type === 'video' ? <VideoIcon size={14} className="text-orange-500" /> : <Music size={14} className="text-zinc-500" />}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{song.media_type}</span>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{song.title}</h3>
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">{song.artist_name}</p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => updateStatus(song.id, 'approved')}
                  className="flex-1 md:flex-none bg-orange-500 text-black px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-orange-400 transition-all hover:scale-105 active:scale-95"
                >
                  Approve
                </button>
                <button 
                  onClick={() => updateStatus(song.id, 'rejected')}
                  className="flex-1 md:flex-none bg-white/5 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all hover:scale-105 active:scale-95 border border-white/5"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {!loading && pendingSongs.length === 0 && (
            <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-orange-500/10 rounded-full">
                  <Check className="text-orange-500" size={32} />
                </div>
              </div>
              <p className="text-zinc-500 font-black italic uppercase tracking-[0.2em] text-xs">Queue Clear</p>
              <p className="text-[10px] text-zinc-700 mt-2 uppercase">All tracks have been reviewed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}