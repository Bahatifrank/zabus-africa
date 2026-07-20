"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePlayerStore } from "@/app/store/usePlayerStore";
import { Play, Flame, PlusCircle, Check, X, AlertCircle, Lock, Heart, Music2, Sparkles } from "lucide-react";
import Link from "next/link";

const GENRES = [
  "All", "Afrobeats", "Afropop", "Bongo Flava", "Hip Hop & Rap",
  "Drill", "Gospel", "Amapiano", "Dancehall", "Reggae", "R&B",
  "Pop", "Traditional", "Highlife"
];

const supabase = createClient();

function SongCard({ song, queue, isLiked, onPlay, onBookmark, onAddToPlaylist }: any) {
  return (
    <div className="w-full flex flex-col group relative mb-2">
      {/* Thumbnail Area - Edge to edge styled 16:9 aspect ratio */}
      <div 
        onClick={() => onPlay(song, queue)} 
        className="relative aspect-video w-full rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 shadow-md border border-white/5"
      >
        <img 
          src={song.cover_url} 
          className="object-cover w-full h-full group-hover:scale-105 transition duration-500" 
          alt={song.title} 
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/90 p-4 rounded-full scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl">
            <Play fill="black" size={18} className="text-black ml-0.5" />
          </div>
        </div>

        {/* Dynamic Action Buttons Overlay (Hidden by default on mobile, reveals on hover) */}
        <div className="absolute top-3 right-3 z-30 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPlaylist(song.id); }}
            className="p-2 bg-orange-500 rounded-full hover:scale-110 transition-all text-black shadow-lg"
          >
            <PlusCircle size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBookmark(song.id); }}
            className="p-2 bg-black/80 backdrop-blur-md rounded-full hover:scale-110 transition-all shadow-lg border border-white/10"
          >
            <Heart size={14} fill={isLiked ? "#ef4444" : "none"} className={isLiked ? "text-red-500" : "text-white"} />
          </button>
        </div>
      </div>

      {/* Info Row below asset - YouTube Style */}
      <div className="mt-3 flex items-start gap-3 px-1">
        {/* Mock Channel/Artist Avatar */}
        <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
          <span className="text-[10px] font-black text-orange-500 uppercase">
            {song.artist_name?.slice(0, 2) || "ZA"}
          </span>
        </div>

        {/* Meta Text */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-sm text-zinc-100 line-clamp-2 leading-tight tracking-tight mb-0.5">
            {song.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-400 font-medium">
            <Link href={`/artists/${encodeURIComponent(song.artist_name)}`}>
              <span className="hover:text-orange-500 transition-colors truncate block max-w-[140px]">
                {song.artist_name}
              </span>
            </Link>
            <span className="text-zinc-600 text-[8px]">•</span>
            <span className="text-orange-500 text-[10px] uppercase font-bold tracking-wider">
              {song.genre || 'Mood'}
            </span>
          </div>
        </div>

        {/* Mobile Action Trigger (optional 3-dot style placeholder if wanted, keeping it pure clean here) */}
      </div>
    </div>
  );
}
export default function HomePage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<any[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<any[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [activeGenre, setActiveGenre] = useState("All");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasRecommendations, setHasRecommendations] = useState(false);

  const { setCurrentSong } = usePlayerStore();

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [addedStatus, setAddedStatus] = useState<string | null>(null);
  const [isUserSignedIn, setIsUserSignedIn] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);

    const { data: songsData } = await supabase
      .from("songs")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    const allSongs = songsData || [];
    setSongs(allSongs);
    setFilteredSongs(allSongs);

    const trending = [...allSongs]
      .sort((a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0)))
      .slice(0, 12);
    setTrendingSongs(trending);

    if (authUser) {
      setIsUserSignedIn(true);

      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("track_id")
        .eq("user_id", authUser.id);

      const ids = (bookmarks || []).map((b: any) => b.track_id);
      setBookmarkedIds(ids);

      if (ids.length > 0) {
        const { data: recommended } = await supabase
          .rpc("get_recommended_songs", { p_user_id: authUser.id });

        if (recommended && recommended.length > 0) {
          setRecommendedSongs(recommended);
          setHasRecommendations(true);
        }
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    if (activeGenre === "All") {
      setFilteredSongs(songs);
    } else {
      setFilteredSongs(songs.filter(s => s.genre?.toLowerCase() === activeGenre.toLowerCase()));
    }
  }, [activeGenre, songs]);

  async function toggleBookmark(songId: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return alert("Please login to bookmark songs!");

    const isBookmarked = bookmarkedIds.includes(songId);
    setBookmarkedIds(prev => isBookmarked ? prev.filter(id => id !== songId) : [...prev, songId]);

    try {
      if (isBookmarked) {
        await supabase.from("bookmarks").delete().eq("user_id", authUser.id).eq("track_id", songId);
      } else {
        await supabase.from("bookmarks").upsert({ user_id: authUser.id, track_id: songId }, { onConflict: 'user_id,track_id' });
      }
      if (authUser) {
        const { data: recommended } = await supabase.rpc("get_recommended_songs", { p_user_id: authUser.id });
        if (recommended && recommended.length > 0) {
          setRecommendedSongs(recommended);
          setHasRecommendations(true);
        }
      }
    } catch {
      setBookmarkedIds(prev => isBookmarked ? [...prev, songId] : prev.filter(id => id !== songId));
    }
  }

  async function handleAddClick(songId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setIsUserSignedIn(false);
      setPlaylists([]);
      setShowPlaylistModal(true);
      return;
    }
    setIsUserSignedIn(true);
    setSelectedSongId(songId);
    const { data } = await supabase.from("playlists").select("*").eq("user_id", userData.user.id).order("title", { ascending: true });
    setPlaylists(data || []);
    setShowPlaylistModal(true);
  }

  async function addToPlaylist(playlistId: string) {
    if (!selectedSongId) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: existing } = await supabase.from("playlist_tracks").select("id").eq("playlist_id", playlistId).eq("track_id", selectedSongId).maybeSingle();
    if (existing) {
      setAddedStatus(`exists-${playlistId}`);
      setTimeout(() => setAddedStatus(null), 2500);
      return;
    }

    await supabase.from("playlist_tracks").insert({ playlist_id: playlistId, track_id: selectedSongId, user_id: userData.user.id });
    setAddedStatus(`success-${playlistId}`);
    setTimeout(() => { setShowPlaylistModal(false); setAddedStatus(null); setSelectedSongId(null); }, 1200);
  }

  const cardProps = (queue: any[]) => ({
    queue,
    onPlay: setCurrentSong,
    onBookmark: toggleBookmark,
    onAddToPlaylist: handleAddClick,
  });

  return (
    <div className="p-6 space-y-10 pb-32 bg-black min-h-screen text-white font-sans">
      {/* HERO */}
      <div className="relative h-[280px] w-full rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <img src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale" alt="" />
        <div className="relative z-20 h-full flex flex-col justify-end p-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-10 bg-orange-500 rounded-full" />
            <span className="text-orange-500 font-black uppercase tracking-[0.4em] text-[10px]">Stadium Live Experience</span>
          </div>
          <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none">ZABUS AFRICA</h1>
        </div>
      </div>

      {/* RECOMMENDED FOR YOU */}
      {hasRecommendations && (
        <section>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <Sparkles className="text-orange-500" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Recommended For You</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5">Based on your taste</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-2">
            {recommendedSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isLiked={bookmarkedIds.includes(song.id)}
                {...cardProps(recommendedSongs)}
              />
            ))}
          </div>
        </section>
      )}

      {/* GENRE SCROLLER */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20">
            <Music2 size={20} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Explore Categories</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 px-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border
                ${activeGenre === genre
                  ? "bg-white text-black border-white shadow-lg shadow-white/10 scale-105"
                  : "bg-[#121212] text-zinc-400 hover:bg-[#181818] border-white/5 hover:border-white/20"
                }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      {activeGenre === "All" && (
        <section>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <Flame className="text-orange-500" size={20} />
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Match Day Trending</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-2">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-zinc-900 animate-pulse rounded-[2.5rem]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-2">
              {trendingSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isLiked={bookmarkedIds.includes(song.id)}
                  {...cardProps(trendingSongs)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ALL / GENRE FILTERED */}
      <section>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-orange-500/20 p-2 rounded-lg">
            <Music2 className="text-orange-500" size={20} />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">
            {activeGenre === "All" ? "All Tracks" : `${activeGenre} Anthems`}
          </h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-2">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-zinc-900 animate-pulse rounded-[2.5rem]" />)}
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-2">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isLiked={bookmarkedIds.includes(song.id)}
                {...cardProps(filteredSongs)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/10 rounded-[3rem] border border-dashed border-white/5 mx-2">
            <AlertCircle size={48} className="text-zinc-800 mb-4" />
            <p className="text-zinc-600 font-black italic uppercase tracking-widest text-sm">No {activeGenre} tracks available</p>
          </div>
        )}
      </section>

      {/* PLAYLIST MODAL */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic uppercase text-orange-500 tracking-tighter">
                {isUserSignedIn ? "Add to Library" : "Access Denied"}
              </h2>
              <button onClick={() => setShowPlaylistModal(false)} className="text-zinc-500 hover:text-white transition-all">
                <X size={32} />
              </button>
            </div>
            <div className="space-y-4">
              {!isUserSignedIn ? (
                <div className="text-center py-10">
                  <Lock className="text-orange-500 mx-auto mb-6" size={48} />
                  <p className="font-bold text-zinc-400 mb-8 px-6 text-sm uppercase tracking-widest leading-relaxed">Login to curate your personal stadium collection</p>
                  <Link href="/login" className="block w-full bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-orange-500 transition-all">
                    Sign In Now
                  </Link>
                </div>
              ) : playlists.length > 0 ? (
                playlists.map((playlist) => {
                  const isSuccess = addedStatus === `success-${playlist.id}`;
                  const isExists = addedStatus === `exists-${playlist.id}`;
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => addToPlaylist(playlist.id)}
                      disabled={addedStatus !== null}
                      className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all duration-500 border ${
                        isSuccess ? "bg-green-600 border-green-400" :
                        isExists ? "bg-orange-600/20 border-orange-500" :
                        "bg-zinc-900 border-transparent hover:border-orange-500/40 hover:bg-zinc-800"
                      }`}
                    >
                      <span className="font-black uppercase text-xs tracking-widest">
                        {isSuccess ? "Saved!" : isExists ? "In Collection" : playlist.title}
                      </span>
                      {isSuccess ? <Check size={20} /> : <PlusCircle size={20} className="text-zinc-700" />}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-zinc-900/50 rounded-3xl border border-dashed border-white/10">
                  <p className="font-black uppercase tracking-widest text-[10px] text-zinc-500 mb-6">No playlists found</p>
                  <Link href="/playlists" className="bg-orange-500 text-black font-black text-[10px] px-10 py-4 rounded-full uppercase">Create New</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}