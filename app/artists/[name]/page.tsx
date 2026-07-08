"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePlayerStore } from "@/app/store/usePlayerStore";
import { Play, Loader2 } from "lucide-react";

const supabase = createClient();

export default function ArtistProfilePage() {
  const { name } = useParams();
  const router = useRouter();
  const artistName = decodeURIComponent((name as string) || "");

  const { setCurrentSong } = usePlayerStore();

  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    getUser();
  }, []);

  useEffect(() => {
    async function fetchSongs() {
      if (!artistName) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .ilike("artist_name", artistName)
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
      } else {
        setSongs(data || []);
      }
      setLoading(false);
    }
    fetchSongs();
  }, [artistName]);

  const startConversation = async () => {
    console.log("startConversation fired", { currentUser, songs });
    if (!currentUser) return;

    const artistId = songs[0]?.user_id;
    console.log("artistId:", artistId);
    if (!artistId) return;

    if (artistId === currentUser.id) {
      alert("This is your own profile");
      return;
    }

    const { data: convId, error } = await supabase
      .rpc("get_or_create_conversation", { other_user_id: artistId });

    console.log("RPC result:", { convId, error });

    if (error) {
      console.error("startConversation error:", error);
      alert("Could not open conversation: " + error.message);
      return;
    }

    router.push(`/inbox/${convId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="text-orange-500 animate-spin mb-4" size={48} />
        <p className="text-orange-500 font-black uppercase text-xs tracking-widest">
          Loading {artistName}...
        </p>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-20 text-white">
        <h2 className="text-2xl font-black uppercase italic">No Tracks Found</h2>
        <p className="text-zinc-500 text-[11px] mt-2 uppercase tracking-widest">
          Check if "{artistName}" matches your database records.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white min-h-screen bg-black">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">
          {artistName}
        </h1>

        {currentUser && (
          <button
            onClick={startConversation}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-black uppercase"
          >
            Message Artist
          </button>
        )}
      </div>

      <div className="space-y-2">
        {songs.map((song, i) => (
          <div
            key={song.id}
            onClick={() => setCurrentSong(song, songs)}
            className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl cursor-pointer group transition-all"
          >
            <span className="text-zinc-600 font-bold w-6">{i + 1}</span>

            <img
              src={song.cover_url}
              className="w-14 h-14 rounded-lg object-cover"
              alt=""
            />

            <div className="flex-1">
              <p className="font-bold group-hover:text-orange-500 transition-colors">
                {song.title}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                {song.artist_name}
              </p>
            </div>

            <Play className="text-zinc-600 group-hover:text-orange-500" size={20} />
          </div>
        ))}
      </div>
    </div>
  );
}