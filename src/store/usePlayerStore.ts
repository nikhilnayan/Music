import { create } from 'zustand';
import { Song } from '../types';

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
  addToPlaylist: (playlistName: string, song: Song) => void;
  removeFromPlaylist: (playlistName: string, songId: string) => void;
  nextSong: () => Song | null;
  previousSong: () => Song | null;
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
  
  createPlaylist: (name) => set((state) => ({
    playlists: { ...state.playlists, [name]: [] }
  })),
  
  addToPlaylist: (playlistName, song) => set((state) => ({
    playlists: {
      ...state.playlists,
      [playlistName]: state.playlists[playlistName].find(s => s.id === song.id) 
        ? state.playlists[playlistName] 
        : [...state.playlists[playlistName], song]
    }
  })),
  
  removeFromPlaylist: (playlistName, songId) => set((state) => ({
    playlists: {
      ...state.playlists,
      [playlistName]: state.playlists[playlistName].filter(s => s.id !== songId)
    }
  })),

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
  }
}));
