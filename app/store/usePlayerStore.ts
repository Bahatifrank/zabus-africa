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

  // PLAYLIST STATES
  playlists: Playlist[];

  setCurrentSong: (song: any, songList?: any[]) => void;

  // Support both naming conventions
  setIsPlaying: (playing: boolean) => void;
  setPlaying: (playing: boolean) => void;

  setIsExpanded: (expanded: boolean) => void;
  setIsLoading: (loading: boolean) => void;

  playNext: () => void;
  playPrevious: () => void;

  // PLAYLIST ACTIONS
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
  playlists: [],

  setCurrentSong: (song, songList = []) => {
    const state = get();

    if (state.currentSong?.id === song.id) {
      set({
        isPlaying: !state.isPlaying,
      });
      return;
    }

    set({
      currentSong: song,
      isPlaying: true,
      isLoading: true,
      ...(songList.length > 0 && { queue: songList }),
    });
  },

  setIsPlaying: (playing) =>
    set({
      isPlaying: playing,
    }),

  // Alias for compatibility with older components
  setPlaying: (playing) =>
    set({
      isPlaying: playing,
    }),

  setIsExpanded: (expanded) =>
    set({
      isExpanded: expanded,
    }),

  setIsLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  // PLAYLIST LOGIC
  createPlaylist: (name) => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      songs: [],
    };

    set((state) => ({
      playlists: [...state.playlists, newPlaylist],
    }));
  },

  addSongToPlaylist: (playlistId, song) => {
    set((state) => ({
      playlists: state.playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          const exists = playlist.songs.some(
            (existingSong) => existingSong.id === song.id
          );

          if (exists) return playlist;

          return {
            ...playlist,
            songs: [...playlist.songs, song],
          };
        }

        return playlist;
      }),
    }));
  },

  removeSongFromPlaylist: (playlistId, songId) => {
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              songs: playlist.songs.filter(
                (song) => song.id !== songId
              ),
            }
          : playlist
      ),
    }));
  },

  incrementView: async (songId: string) => {
    const supabase = createClient();

    try {
      await supabase.rpc('increment_views', {
        song_id: songId,
      });

      const { currentSong } = get();

      if (currentSong?.id === songId) {
        set({
          currentSong: {
            ...currentSong,
            views: (currentSong.views || 0) + 1,
          },
        });
      }
    } catch (error) {
      console.error('View increment failed:', error);
    }
  },

  toggleLike: async (songId: string, currentLikes: number) => {
    const supabase = createClient();

    const newLikes = currentLikes + 1;

    const { error } = await supabase
      .from('songs')
      .update({
        likes: newLikes,
      })
      .eq('id', songId);

    if (error) {
      console.error('Error updating likes:', error.message);
      return;
    }

    const { currentSong } = get();

    if (currentSong?.id === songId) {
      set({
        currentSong: {
          ...currentSong,
          likes: newLikes,
        },
      });
    }
  },

  playNext: () => {
    const { currentSong, queue } = get();

    if (!currentSong || queue.length === 0) {
      return;
    }

    const currentIndex = queue.findIndex(
      (song) => song.id === currentSong.id
    );

    if (
      currentIndex !== -1 &&
      currentIndex < queue.length - 1
    ) {
      set({
        currentSong: queue[currentIndex + 1],
        isPlaying: true,
        isLoading: true,
      });
    }
  },

  playPrevious: () => {
    const { currentSong, queue } = get();

    if (!currentSong || queue.length === 0) {
      return;
    }

    const currentIndex = queue.findIndex(
      (song) => song.id === currentSong.id
    );

    if (currentIndex > 0) {
      set({
        currentSong: queue[currentIndex - 1],
        isPlaying: true,
        isLoading: true,
      });
    }
  },
}));