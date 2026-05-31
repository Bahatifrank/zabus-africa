import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

// Define Playlist interface
interface Playlist {
  id: string;
  name: string;
  songs: any[];
}

interface PlayerState {
  currentSong: any | null;
  isPlaying: boolean;
  isExpanded: boolean;
  isLoading: boolean; 
  queue: any[];
  // NEW PLAYLIST STATES
  playlists: Playlist[];
  
  setCurrentSong: (song: any, songList?: any[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  
  // NEW PLAYLIST ACTIONS
  createPlaylist: (name: string) => void;
  addSongToPlaylist: (playlistId: string, song: any) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;

  incrementView: (songId: string) => Promise<void>;
  toggleLike: (songId: string, currentLikes: number) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  isExpanded: false,
  isLoading: false,
  queue: [],
  // Initialize with empty playlists
  playlists: [],

  setCurrentSong: (song, songList = []) => {
    const state = get();
    if (state.currentSong?.id === song.id) {
      set({ isPlaying: !state.isPlaying });
      return;
    }
    set({ 
      currentSong: song, 
      isPlaying: true, 
      isLoading: true,
      ...(songList.length > 0 && { queue: songList })
    });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  // --- PLAYLIST LOGIC ---
  createPlaylist: (name) => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`, // Unique ID based on timestamp
      name: name,
      songs: []
    };
    set((state) => ({
      playlists: [...state.playlists, newPlaylist]
    }));
  },

  addSongToPlaylist: (playlistId, song) => {
    set((state) => ({
      playlists: state.playlists.map((pl) => {
        if (pl.id === playlistId) {
          // Prevent duplicate songs in same playlist
          const exists = pl.songs.some((s) => s.id === song.id);
          return exists ? pl : { ...pl, songs: [...pl.songs, song] };
        }
        return pl;
      })
    }));
  },

  removeSongFromPlaylist: (playlistId, songId) => {
    set((state) => ({
      playlists: state.playlists.map((pl) => 
        pl.id === playlistId 
          ? { ...pl, songs: pl.songs.filter((s) => s.id !== songId) } 
          : pl
      )
    }));
  },

  // --- EXISTING SUPABASE LOGIC ---
  incrementView: async (songId: string) => {
    const supabase = createClient();
    try {
      await supabase.rpc('increment_views', { song_id: songId });
      const { currentSong } = get();
      if (currentSong?.id === songId) {
        set({ currentSong: { ...currentSong, views: (currentSong.views || 0) + 1 } });
      }
    } catch (err) {
      console.error("View increment failed:", err);
    }
  },

  toggleLike: async (songId: string, currentLikes: number) => {
    const supabase = createClient();
    const newLikes = currentLikes + 1;
    const { error } = await supabase
      .from('songs')
      .update({ likes: newLikes })
      .eq('id', songId);

    if (error) {
      console.error("Error updating likes:", error.message);
      return;
    }
    const { currentSong } = get();
    if (currentSong?.id === songId) {
      set({ currentSong: { ...currentSong, likes: newLikes } });
    }
  },

  playNext: () => {
    const { currentSong, queue } = get();
    if (!currentSong || queue.length === 0) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      set({ currentSong: queue[currentIndex + 1], isPlaying: true, isLoading: true });
    }
  },

  playPrevious: () => {
    const { currentSong, queue } = get();
    if (!currentSong || queue.length === 0) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex > 0) {
      set({ currentSong: queue[currentIndex - 1], isPlaying: true, isLoading: true });
    }
  },
}));