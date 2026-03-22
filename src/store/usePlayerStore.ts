import { create } from 'zustand';
import { Song } from '../types';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  playlists: { [key: string]: Song[] };
  setCurrentSong: (song: Song | null) => void;
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  createPlaylist: (name: string) => void;
  deletePlaylist: (name: string) => void;
  addToPlaylist: (playlistName: string, song: Song) => void;
  removeFromPlaylist: (playlistName: string, songId: string) => void;
  nextSong: () => Song | null;
  previousSong: () => Song | null;
  toggleFavorite: (song: Song) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  playlists: { 'My Favorites': [] },

  setCurrentSong: (song) => set({ currentSong: song }),

  setQueue: (queue) => set({ queue }),

  addToQueue: (song) => set((state) => ({
    queue: state.queue.find(s => s.id === song.id) ? state.queue : [...state.queue, song]
  })),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  createPlaylist: async (name) => {
    const state = get();
    if (state.playlists[name]) return;
    const newPlaylists = { ...state.playlists, [name]: [] };
    set({ playlists: newPlaylists });

    const { session } = useAuthStore.getState();
    if (session?.user) {
      const { error } = await supabase.from('user_playlists').insert({ user_id: session.user.id, name, songs: [] });
      if (error) {
        import('react-native').then(RN => {
          RN.Alert.alert('Database Error', `Failed to create playlist: ${error.message}`);
        });
      }
    }
  },

  deletePlaylist: async (name) => {
    const state = get();
    const { [name]: _, ...rest } = state.playlists;
    set({ playlists: rest });

    const { session } = useAuthStore.getState();
    if (session?.user) {
      await supabase.from('user_playlists').delete().match({ user_id: session.user.id, name });
    }
  },

  addToPlaylist: async (playlistName, song) => {
    const state = get();
    const playlist = state.playlists[playlistName] || [];
    if (playlist.find(s => s.id === song.id)) return;
    
    const newSongs = [...playlist, song];
    set({ playlists: { ...state.playlists, [playlistName]: newSongs } });

    const { session } = useAuthStore.getState();
    if (session?.user) {
      await supabase.from('user_playlists').update({ songs: newSongs }).match({ user_id: session.user.id, name: playlistName });
    }
  },

  removeFromPlaylist: async (playlistName, songId) => {
    const state = get();
    const playlist = state.playlists[playlistName] || [];
    const newSongs = playlist.filter(s => s.id !== songId);
    set({ playlists: { ...state.playlists, [playlistName]: newSongs } });

    const { session } = useAuthStore.getState();
    if (session?.user) {
      await supabase.from('user_playlists').update({ songs: newSongs }).match({ user_id: session.user.id, name: playlistName });
    }
  },

  nextSong: () => {
    const { currentSong, queue } = get();
    if (!currentSong || queue.length === 0) return null;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex < queue.length - 1) {
      const next = queue[currentIndex + 1];
      set({ currentSong: next });
      return next;
    }
    return null;
  },

  previousSong: () => {
    const { currentSong, queue } = get();
    if (!currentSong || queue.length === 0) return null;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex > 0) {
      const prev = queue[currentIndex - 1];
      set({ currentSong: prev });
      return prev;
    }
    return null;
  },

  toggleFavorite: async (song) => {
    const { session } = useAuthStore.getState();
    const state = get();
    const favorites = state.playlists['My Favorites'] || [];
    const isLiked = favorites.find(s => s.id === song.id);

    // Optimistic UI Update
    const newFavorites = isLiked ? favorites.filter(s => s.id !== song.id) : [...favorites, song];
    set({ playlists: { ...state.playlists, 'My Favorites': newFavorites } });

    // Cloud Sync
    if (session?.user) {
      if (isLiked) {
        const { error } = await supabase
          .from('liked_songs')
          .delete()
          .match({ user_id: session.user.id, song_id: song.id });
        if (error) console.log('Delete Fav Error:', error.message);
      } else {
        const { error } = await supabase
          .from('liked_songs')
          .insert({
            user_id: session.user.id,
            song_id: song.id,
            title: song.title,
            artist: song.artist,
            artwork: song.artwork,
            url: song.url,
            duration: song.duration || 0,
          });
        if (error) console.log('Insert Fav Error:', error.message);
      }
    }
  },

  fetchFavorites: async () => {
    const { session } = useAuthStore.getState();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('liked_songs')
      .select('*')
      .eq('user_id', session.user.id);

    if (data && !error) {
      const state = get();
      const formattedSongs = data.map(dbRow => ({
        id: dbRow.song_id,
        title: dbRow.title,
        artist: dbRow.artist,
        artwork: dbRow.artwork,
        url: dbRow.url,
        duration: dbRow.duration
      }));
      set({ playlists: { ...state.playlists, 'My Favorites': formattedSongs } });
    } else if (error) {
      console.log('Fetch Fav Error:', error.message);
    }
  },

  fetchPlaylists: async () => {
    const { session } = useAuthStore.getState();
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('user_id', session.user.id);

      if (data && !error) {
        const state = get();
        const newPlaylists: { [key: string]: Song[] } = { ...state.playlists };
        data.forEach((row: any) => {
          const pName = row.name || row.title || row.playlist_name;
          if (pName && pName !== 'My Favorites') {
            newPlaylists[pName] = row.songs || [];
          }
        });
        set({ playlists: newPlaylists });
      } else if (error) {
        console.log('Fetch Playlists Error:', error.message);
        import('react-native').then(RN => {
          RN.Alert.alert('Database Sync Error', `Could not fetch playlists: ${error.message}`);
        });
      }
    } catch (e) {
      console.log('Fetch Playlists failed:', e);
    }
  }
}));
