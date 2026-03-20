import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar, SafeAreaView, Platform, Share, Alert } from 'react-native';
import TrackPlayer, { useProgress, usePlaybackState, State, Event, useTrackPlayerEvents, RepeatMode } from 'react-native-track-player';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { usePlayerStore } from '../store/usePlayerStore';

const { width } = Dimensions.get('window');

const events = [Event.PlaybackTrackChanged, Event.PlaybackError];

export default function PlayerScreen({ navigation }: any) {
  const { currentSong, setCurrentSong, toggleFavorite, playlists, queue, setQueue } = usePlayerStore();
  const progress = useProgress();
  const state = usePlaybackState();
  const isPlaying = (state as any)?.state === State.Playing || state === State.Playing;
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
  const [volume, setVolume] = useState(0.5);

  const isLiked = playlists['My Favorites']?.some(s => s.id === currentSong?.id);

  useTrackPlayerEvents(events, async (event) => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) setCurrentSong(track as any);
    }
  });

  const togglePlayback = async () => {
    isPlaying ? await TrackPlayer.pause() : await TrackPlayer.play();
  };

  const skipNext = async () => {
    try { await TrackPlayer.skipToNext(); } catch (e) {}
  };

  const skipPrev = async () => {
    try { await TrackPlayer.skipToPrevious(); } catch (e) {}
  };

  const handleShuffle = async () => {
    const newShuffle = !isShuffle;
    setIsShuffle(newShuffle);
    if (newShuffle) {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      await TrackPlayer.reset();
      await TrackPlayer.add(shuffled);
      await TrackPlayer.play();
    }
  };

  const handleRepeat = async () => {
    let nextMode = RepeatMode.Off;
    if (repeatMode === RepeatMode.Off) nextMode = RepeatMode.Track;
    else if (repeatMode === RepeatMode.Track) nextMode = RepeatMode.Queue;
    
    setRepeatMode(nextMode);
    await TrackPlayer.setRepeatMode(nextMode);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    TrackPlayer.setVolume(value);
  };

  const handleMoreOptions = () => {
    Alert.alert(
      "Options",
      currentSong?.title,
      [
        { text: "Share Song", onPress: () => Share.share({ message: `Check out ${currentSong?.title} on MUSIC!` }) },
        { text: "View Artist", onPress: () => console.log("Artist") },
        { text: "Add to Queue", onPress: () => console.log("Queue") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const formatTitle = (text: string) => {
    return text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
  };

  if (!currentSong) return null;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#060606" />
      
      {/* 1. TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-down" size={32} color="#444" />
        </TouchableOpacity>
        <Text style={styles.npLabel}>NOW PLAYING</Text>
        <TouchableOpacity onPress={handleMoreOptions}>
          <Icon name="ellipsis-vertical" size={24} color="#444" />
        </TouchableOpacity>
      </View>

      {/* 2. ARTWORK CENTER */}
      <View style={styles.artSection}>
        <View style={[styles.artGlow, { backgroundColor: isPlaying ? colors.accent : '#222' }]} />
        <View style={styles.artWrapper}>
          <Image source={{ uri: currentSong.artwork }} style={styles.art} />
        </View>
      </View>

      {/* 3. TRACK INFO */}
      <View style={styles.metaSection}>
        <View style={styles.metaLeft}>
           <Text style={styles.trackName} numberOfLines={1}>{formatTitle(currentSong.title).toUpperCase()}</Text>
           <Text style={styles.trackArtist}>{currentSong.artist.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(currentSong)}>
           <Icon 
             name={isLiked ? "heart" : "heart-outline"} 
             size={32} 
             color={isLiked ? colors.accent2 : "#444"} 
           />
        </TouchableOpacity>
      </View>

      {/* 4. PROGRESS */}
      <View style={styles.progSection}>
        <Slider
          style={styles.slider}
          value={progress.position}
          minimumValue={0}
          maximumValue={progress.duration}
          thumbTintColor={colors.accent}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor="#222"
          onSlidingComplete={(v) => TrackPlayer.seekTo(v)}
        />
        <View style={styles.timeWrapper}>
          <Text style={styles.timeText}>{new Date(progress.position * 1000).toISOString().substr(14, 5)}</Text>
          <Text style={styles.timeText}>{new Date(progress.duration * 1000).toISOString().substr(14, 5)}</Text>
        </View>
      </View>

      {/* 5. CONTROLS */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={handleShuffle} style={styles.subCtrl}>
          <Icon name="shuffle" size={22} color={isShuffle ? colors.accent : "#444"} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={skipPrev}>
           <Icon name="play-skip-back" size={28} color="#EFEFEF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayback} style={styles.playBtn}>
           <Icon 
             name={isPlaying ? "pause" : "play"} 
             size={32} 
             color="#000" 
             style={!isPlaying && { marginLeft: 4 }}
           />
        </TouchableOpacity>

        <TouchableOpacity onPress={skipNext}>
           <Icon name="play-skip-forward" size={28} color="#EFEFEF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRepeat} style={styles.subCtrl}>
          <Icon 
            name={repeatMode === RepeatMode.Track ? "repeat" : "repeat-outline"} 
            size={22} 
            color={repeatMode !== RepeatMode.Off ? colors.accent : "#444"} 
          />
        </TouchableOpacity>
      </View>

      {/* 6. WIDE VOLUME BAR (Simplified to standard for crash-prevention) */}
      <View style={styles.volumeRow}>
        <Icon name="volume-low" size={18} color="#444" />
        <Slider
          style={styles.volumeSlider}
          value={volume}
          minimumValue={0}
          maximumValue={1}
          thumbTintColor="#666"
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor="#222"
          onValueChange={handleVolumeChange}
        />
        <Icon name="volume-high" size={20} color="#444" />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060606' },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingVertical: 10 
  },
  npLabel: { 
    fontSize: 10, 
    letterSpacing: 4, 
    color: '#444', 
    fontWeight: '800' 
  },
  artSection: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  artGlow: {
    padding: 1,
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.15,
  },
  artWrapper: {
    width: width * 0.78,
    height: width * 0.78,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 32,
    shadowColor: '#000',
    shadowOpacity: 0.9,
    shadowRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  art: { width: '100%', height: '100%' },
  metaSection: { 
    paddingHorizontal: 28, 
    paddingBottom: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  metaLeft: { flex: 1, marginRight: 20 },
  trackName: { 
    fontFamily: Platform.OS === 'ios' ? 'Bebas Neue' : 'sans-serif-condensed', 
    fontSize: 36, 
    letterSpacing: 3, 
    color: '#EFEFEF', 
    fontWeight: '800', 
    marginBottom: 6,
    lineHeight: 40
  },
  trackArtist: { fontSize: 13, letterSpacing: 2.5, color: '#444', fontWeight: '800' },
  progSection: { paddingHorizontal: 28, marginBottom: 20 },
  slider: { width: '100%', height: 10 },
  timeWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { fontSize: 11, letterSpacing: 1, color: '#444', fontWeight: '900' },
  controls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 28, 
    height: 100
  },
  playBtn: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: colors.accent, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10
  },
  subCtrl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  volumeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 28, 
    paddingBottom: 25, 
    gap: 15 
  },
  volumeSlider: { 
    flex: 1, 
    height: 40
  }
});
