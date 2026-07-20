"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePlayerStore } from "@/app/store/usePlayerStore";
import { Play, Heart, Music, ArrowLeft, Lock, X } from "lucide-react";
import Link from "next/link";

export default function BookmarksPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentSong, setIsPlaying } = usePlayerStore(); // Added setIsPlaying
  const supabase = createClient();

  // Modal Auth Intercept state management
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isUserSignedIn, setIsUserSignedIn] = useState(false);

  useEffect(() => {
    async function fetchBookmarkedSongs() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsUserSignedIn(false);
          setLoading(false);
          return;
        }

        setIsUserSignedIn(true);

        const { data, error } = await supabase
          .from("bookmarks")
          .select(`
            id,
            track_id,
            songs!bookmarks_track_id_fkey (
              id,
              title,
              artist_name,
              cover_url,
              audio_url,
              media_url, 
              duration_seconds
            )
          `) // Added media_url to the selection above
          .eq("user_id", user.id);

        if (error) {
          console.error("Supabase Error Detail:", error.message);
          setLoading(false);
          return;
        }

        if (data) {
          const bookmarkedSongs = data
            .map((item: any) => {
              if (!item.songs) return null;
              
              // Normalize the song object so it always has an audio_url
              return {
                ...item.songs,
                audio_url: item.songs.audio_url || item.songs.media_url,
                bookmark_record_id: item.id 
              };
            })
            .filter(Boolean);

          setSongs(bookmarkedSongs);
        }
      } catch (err) {
        console.error("Unexpected error fetching bookmarks:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarkedSongs();
  }, [supabase]);

  const handlePlay = (song: any) => {
    // 1. Double check we have a URL
    const activeUrl = song.audio_url || song.media_url;

    if (!activeUrl) {
      alert("This song doesn't have an audio file attached yet!");
      return;
    }

    // 2. Prepare the track object for the global store
    const trackToPlay = {
      ...song,
      audio_url: activeUrl // Ensure the store gets a valid audio_url
    };

    try {
      // 3. Update Store
      setCurrentSong(trackToPlay, songs);
      setIsPlaying(true);
      
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  async function toggleBookmark(songId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Smooth intercept: Open auth modal overlay if guest clicks heart
    if (!user) {
      setIsUserSignedIn(false);
      setShowPlaylistModal(true);
      return;
    }

    const removedSong = songs.find((s) => s.id === songId);
    setSongs((prev) => prev.filter((song) => song.id !== songId));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("track_id", songId);

    if (error) {
      console.error("Delete error:", error.message);
      if (removedSong) {
        setSongs((prev) => [removedSong, ...prev]);
      }
    }
  }

  if (loading) {
    return (
      <div className="p-10 bg-black min-h-screen flex items-center justify-center text-orange-500 uppercase font-black text-xs tracking-[0.3em] animate-pulse">
        LOADING FAVORITES...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-32 bg-black min-h-screen text-white">
      <div className="flex items-center gap-4 mb-12">
        <Link
          href="/"
          className="p-3 bg-white/5 hover:bg-orange-500 hover:text-black rounded-2xl transition-all text-white group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter">
            My Bookmarks
          </h1>
          <p className="text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
            Your Favorite Sounds
          </p>
        </div>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-4 px-1">
          {songs.map((song) => (
            <div
              key={song.id}
              className="w-full flex flex-col group relative mb-2"
            >
              {/* Thumbnail Area - YouTube Widescreen Style */}
              <div
                onClick={() => handlePlay(song)}
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

                {/* Heart Button Overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(song.id);
                  }}
                  className="absolute top-3 left-3 z-30 p-2 bg-black/80 backdrop-blur-md rounded-full hover:scale-110 transition-all shadow-lg border border-white/10"
                >
                  <Heart size={14} fill="#ef4444" className="text-red-500" />
                </button>
              </div>

              {/* Info Row below image Asset */}
              <div className="mt-3 flex items-start gap-3 px-1">
                {/* Mock Channel/Artist Avatar */}
                <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <span className="text-[10px] font-black text-orange-500 uppercase">
                    {song.artist_name?.slice(0, 2) || "ZA"}
                  </span>
                </div>

                {/* Title & Meta Area */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-sm text-zinc-100 line-clamp-2 leading-tight tracking-tight mb-0.5">
                    {song.title}
                  </h3>
                  <p className="text-zinc-400 text-[11px] truncate font-medium">
                    {song.artist_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-[#0a0a0a] rounded-[3rem] border border-dashed border-white/5">
          <div className="p-6 bg-white/5 rounded-full mb-6">
            <Music className="text-zinc-800" size={48} />
          </div>
          <p className="font-bold uppercase tracking-[0.2em] text-xs text-zinc-600 mb-8">
            Your collection is empty
          </p>
          <Link
            href="/"
            className="bg-orange-500 text-black font-black text-xs uppercase px-10 py-4 rounded-2xl hover:bg-orange-400 hover:scale-105 transition-all tracking-widest"
          >
            Discover Music
          </Link>
        </div>
      )}

      {/* AUTHENTICATION OVERLAY MODAL FOR GUESTS */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-orange-500 tracking-tighter">
                Access Denied
              </h2>
              <button onClick={() => setShowPlaylistModal(false)} className="text-zinc-500 hover:text-white transition-all">
                <X size={28} />
              </button>
            </div>
            <div className="text-center py-6">
              <Lock className="text-orange-500 mx-auto mb-5" size={44} />
              <p className="font-bold text-zinc-400 mb-6 px-4 text-xs sm:text-sm uppercase tracking-widest leading-relaxed">
                Login to curate your personal stadium collection
              </p>
              <Link href="/login" className="block w-full bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-orange-500 transition-all text-center">
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}