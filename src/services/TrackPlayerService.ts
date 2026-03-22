import TrackPlayer, { Event } from 'react-native-track-player';
import { getSimilarSongs } from './api';
import { usePlayerStore } from '../store/usePlayerStore';

export default async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

  // Auto-Recommendation System
  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
    const { nextTrack } = event;
    const { queue, setQueue } = usePlayerStore.getState();

    // If we've reached the last song in the queue (or close to it)
    if (nextTrack !== undefined && nextTrack === queue.length - 1) {
      console.log('RECO: Reached end of queue, fetching recommendations...');
      const lastSong = queue[nextTrack];
      
      try {
        const recommendations = await getSimilarSongs(lastSong);
        
        // Filter out songs already in the queue to avoid duplicates
        const existingIds = new Set(queue.map(s => s.id));
        const newSongs = recommendations.filter(s => !existingIds.has(s.id));

        if (newSongs.length > 0) {
          console.log(`RECO: Found ${newSongs.length} new similar songs. Adding to queue.`);
          
          // Update the localized store
          const updatedQueue = [...queue, ...newSongs];
          setQueue(updatedQueue);

          // Add to TrackPlayer queue
          await TrackPlayer.add(newSongs.map(s => ({
            id: s.id,
            url: s.url,
            title: s.title,
            artist: s.artist,
            artwork: s.artwork,
            duration: s.duration,
          })));
        }
      } catch (err) {
        console.error('RECO: Error fetching suggestions:', err);
      }
    }
  });
};
