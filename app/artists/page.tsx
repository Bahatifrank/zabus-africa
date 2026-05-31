"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

type Artist = {
  name: string;
  image: string;
  songCount: number;
};

export default function ArtistsPage() {
  // Memoize supabase to prevent unnecessary re-renders
  const supabase = useMemo(() => createClient(), []);
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtists() {
      setLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select("artist_name, cover_url");

      if (error) {
        console.error("Artist fetch error:", error.message);
        setLoading(false);
        return;
      }

      // Logic to group songs by artist and count them
      const map = new Map<string, Artist>();

      data.forEach((song) => {
        const name = song.artist_name?.trim();
        if (!name) return;

        if (!map.has(name)) {
          map.set(name, {
            name,
            image: song.cover_url,
            songCount: 1,
          });
        } else {
          map.get(name)!.songCount += 1;
        }
      });

      setArtists(Array.from(map.values()));
      setLoading(false);
    }

    fetchArtists();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-orange-500 uppercase text-xs font-black tracking-widest">
        Loading artists…
      </div>
    );
  }

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-12">
          Artists
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12">
          {artists.map((artist) => (
            <Link
              key={artist.name}
              // FIXED: Changed /artist/ to /artists/ to match folder structure
              href={`/artists/${encodeURIComponent(artist.name)}`}
              className="group flex flex-col items-center text-center"
            >
              {/* Profile Image Container */}
              <div className="relative w-full aspect-square rounded-full overflow-hidden bg-zinc-900 shadow-2xl mb-4 border-4 border-transparent group-hover:border-orange-500 transition-all duration-300">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Overlay for better text contrast if needed */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Artist Name */}
              <h3 className="font-black uppercase italic text-sm truncate w-full group-hover:text-orange-500 transition-colors">
                {artist.name}
              </h3>

              {/* Song Count Badge */}
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">
                {artist.songCount} {artist.songCount === 1 ? "Song" : "Songs"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}