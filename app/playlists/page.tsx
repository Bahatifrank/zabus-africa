"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { PlusCircle, Lock, Music2, ChevronLeft, Play, X, ListMusic } from "lucide-react";
import Link from "next/link";
import { usePlayerStore } from "@/app/store/usePlayerStore";

export default function PlaylistsPage() {
  const supabase = createClient();
  const { setCurrentSong } = usePlayerStore();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [isUserSignedIn, setIsUserSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function checkUserAndFetch() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsUserSignedIn(false);
        return;
      }
      setIsUserSignedIn(true);
      fetchPlaylists(userData.user.id);
    }
    checkUserAndFetch();
  }, [supabase]);

  async function fetchPlaylists(userId: string) {
    const { data } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setPlaylists(data || []);
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) return alert("Enter a playlist name");
    setCreating(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("playlists")
      .insert([{ title: newPlaylistTitle, user_id: userData.user.id }]);

    if (error) {
      alert(error.message);
    } else {
      setNewPlaylistTitle("");
      setIsModalOpen(false);
      fetchPlaylists(userData.user.id);
    }
    setCreating(false);
  };

  async function openPlaylist(playlist: any) {
    setSelectedPlaylist(playlist);
    setLoading(true);
    
    const { data: junctionData, error: jError } = await supabase
      .from("playlist_tracks")
      .select("track_id")
      .eq("playlist_id", playlist.id);

    if (jError || !junctionData || junctionData.length === 0) {
      setSongs([]);
      setLoading(false);
      return;
    }

    const trackIds = junctionData.map(item => item.track_id);
    
    const { data: songData, error: sError } = await supabase
      .from("songs")
      .select("*")
      .in("id", trackIds);

    if (!sError) setSongs(songData || []);
    setLoading(false);
  }

  if (isUserSignedIn === null) return <div className="min-h-screen bg-black" />;

  return (
    <div className="p-8 bg-black min-h-screen text-white pb-32">
      
      {/* HEADER SECTION - Only show when no playlist is selected */}
      {!selectedPlaylist && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-10 bg-orange-500 rounded-full" />
              <span className="text-orange-500 font-black uppercase tracking-[0.3em] text-[10px]">Your Vault</span>
            </div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">My Library</h1>
          </div>
          {isUserSignedIn && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-500 text-black font-black px-8 py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-white transition-all flex items-center gap-3 shadow-lg shadow-orange-500/20"
            >
              <PlusCircle size={20} /> Create New List
            </button>
          )}
        </div>
      )}

      {!isUserSignedIn ? (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5 max-w-2xl mx-auto text-center px-6">
          <div className="p-8 bg-orange-500/10 rounded-full mb-8">
            <Lock className="text-orange-500" size={64} />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Access Restricted</h2>
          <p className="text-zinc-500 font-bold mb-8 max-w-xs">Sign in to Zabus Africa to create and manage your personal sound collections.</p>
          <Link href="/login" className="bg-white text-black font-black px-16 py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-orange-500 transition-all">
            Login Now
          </Link>
        </div>
      ) : selectedPlaylist ? (
        /* --- SELECTED PLAYLIST VIEW --- */
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-10">
            <button 
              onClick={() => setSelectedPlaylist(null)} 
              className="flex items-center gap-3 text-zinc-500 font-black uppercase text-[11px] hover:text-orange-500 transition-colors bg-zinc-900/50 px-5 py-3 rounded-full border border-white/5"
            >
              <ChevronLeft size={18} /> BACK TO COLLECTIONS
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-end mb-16">
            <div className="w-64 h-64 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl relative overflow-hidden group">
              {songs.length > 0 ? (
                <img src={songs[0].cover_url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" alt="" />
              ) : null}
              <ListMusic size={80} className="text-orange-500 relative z-10" />
            </div>
            <div className="flex-1">
              <span className="text-orange-500 font-black uppercase tracking-[0.4em] text-[10px]">Playlist</span>
              <h2 className="text-7xl font-black italic uppercase text-white mb-4 tracking-tighter leading-none">
                {selectedPlaylist.title}
              </h2>
              <p className="text-zinc-500 font-bold uppercase text-sm tracking-widest">{songs.length} Tracks Mixed by You</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-4 text-orange-500 font-black italic animate-pulse py-20 justify-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-bounce" />
              SYNCHRONIZING AUDIO...
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-32 bg-zinc-900/10 rounded-[4rem] border-2 border-dashed border-white/5">
              <p className="text-zinc-600 font-black italic uppercase tracking-widest mb-8">THIS COLLECTION IS EMPTY</p>
              <Link 
                href="/" 
                className="bg-orange-500 text-black font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-white transition-all inline-block"
              >
                DISCOVER MUSIC
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {songs.map((song, index) => (
                <div key={song.id} className="flex items-center gap-6 bg-zinc-900/20 p-5 rounded-[2rem] border border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                  <span className="text-zinc-800 font-black italic w-8 text-2xl group-hover:text-orange-500/20 transition-colors">{index + 1}</span>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl shadow-lg">
                    <img src={song.cover_url} className="h-full w-full object-cover" alt="" />
                    <button 
                      onClick={() => setCurrentSong(song, songs)}
                      className="absolute inset-0 bg-orange-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play size={24} fill="black" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black uppercase italic text-xl truncate text-white">{song.title}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{song.artist_name}</p>
                  </div>
                  <div className="hidden md:block text-zinc-600 font-black text-xs italic uppercase mr-10">
                    {song.duration || "3:45"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : playlists.length > 0 ? (
        /* --- PLAYLIST GRID VIEW --- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {playlists.map((playlist) => (
            <div 
              key={playlist.id} 
              onClick={() => openPlaylist(playlist)} 
              className="group cursor-pointer bg-zinc-900/20 border border-white/5 p-10 rounded-[3rem] hover:border-orange-500/50 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 group-hover:text-orange-500 transition-all">
                <Music2 size={40} />
              </div>
              <div className="aspect-square w-20 bg-orange-500/10 rounded-2xl mb-8 flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-500">
                <ListMusic size={32} className="text-orange-500 group-hover:text-black" />
              </div>
              <h3 className="font-black uppercase italic tracking-tighter text-2xl mb-2 text-white leading-tight">{playlist.title}</h3>
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">View Tracks</p>
            </div>
          ))}
        </div>
      ) : (
        /* --- EMPTY LIBRARY VIEW --- */
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/20 rounded-[4rem] border-2 border-dashed border-white/5 max-w-3xl mx-auto text-center">
          <div className="mb-8 p-8 bg-zinc-800/50 rounded-full text-orange-500">
             <PlusCircle size={60} strokeWidth={1} />
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4 text-white">Your library is empty</h2>
          <p className="text-zinc-500 font-bold mb-10 uppercase text-xs tracking-widest">Start your journey by creating a custom collection</p>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-orange-500 text-black font-black px-16 py-5 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:bg-white transition-all"
          >
            Create Playlist
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-[200] backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 p-12 rounded-[4rem] w-full max-w-lg animate-in zoom-in duration-300 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
              <X size={32} />
            </button>
            <div className="mb-10 text-center">
              <span className="text-orange-500 font-black uppercase tracking-[0.5em] text-[10px] block mb-4">New Collection</span>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Name Your Sound</h2>
            </div>
            <input 
              autoFocus 
              className="w-full bg-black/50 border border-white/10 p-6 rounded-3xl mb-8 outline-none focus:border-orange-500 text-white font-black text-2xl uppercase placeholder:text-zinc-800 text-center italic tracking-tighter" 
              placeholder="E.G. GYM PUMP" 
              value={newPlaylistTitle} 
              onChange={(e) => setNewPlaylistTitle(e.target.value)} 
            />
            <button 
              onClick={handleCreatePlaylist} 
              disabled={creating} 
              className="w-full bg-orange-500 text-black font-black py-6 rounded-[2rem] uppercase text-sm tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50 shadow-xl shadow-orange-500/10"
            >
              {creating ? "INITIALIZING..." : "CONFIRM CREATION"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}