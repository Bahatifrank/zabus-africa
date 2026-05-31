"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePlayerStore } from "@/app/store/usePlayerStore";
import { Play, Heart, Music, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BookmarksPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentSong, setIsPlaying } = usePlayerStore(); // Added setIsPlaying
  const supabase = createClient();

  useEffect(() => {
    async function fetchBookmarkedSongs() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

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
    if (!user) return;

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
    <div className="p-6 pb-32 bg-black min-h-screen text-white">
      <div className="flex items-center gap-4 mb-12">
        <Link
          href="/"
          className="p-3 bg-white/5 hover:bg-orange-500 hover:text-black rounded-2xl transition-all text-white group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">
            My Bookmarks
          </h1>
          <p className="text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
            Your Favorite Sounds
          </p>
        </div>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {songs.map((song) => (
            <div
              key={song.id}
              className="bg-[#0a0a0a] p-4 rounded-[2rem] hover:bg-[#121212] transition-all group border border-white/5 relative"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(song.id);
                }}
                className="absolute top-4 left-4 z-30 p-2 bg-black/60 backdrop-blur-md rounded-full hover:scale-110 transition-all shadow-2xl border border-white/10"
              >
                <Heart size={14} fill="#ef4444" className="text-red-500" />
              </button>

              <div
                onClick={() => handlePlay(song)}
                className="relative aspect-square mb-4 rounded-2xl overflow-hidden cursor-pointer"
              >
                <img
                  src={song.cover_url}
                  className="object-cover w-full h-full group-hover:scale-110 transition duration-700"
                  alt={song.title}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-orange-500 p-4 rounded-full scale-75 group-hover:scale-100 transition-transform duration-300">
                    <Play fill="black" size={24} className="text-black ml-1" />
                  </div>
                </div>
              </div>

              <div className="px-1">
                <h3 className="font-black truncate text-sm text-white mb-1 uppercase italic tracking-tight">
                  {song.title}
                </h3>
                <p className="text-zinc-500 text-[10px] truncate uppercase font-black tracking-widest">
                  {song.artist_name}
                </p>
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
    </div>
  );
}