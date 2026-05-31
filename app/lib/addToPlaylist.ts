import { createClient } from "@/utils/supabase/client";

export async function addToPlaylist(
  playlistId: string,
  trackId: string
) {
  const supabase = createClient();

  await supabase.from("playlist_tracks").insert({
    playlist_id: playlistId,
    track_id: trackId,
  });
}
