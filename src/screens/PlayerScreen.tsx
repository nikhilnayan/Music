import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar, SafeAreaView, Platform, Share, Modal, Animated, PanResponder } from 'react-native';
import TrackPlayer, { useProgress, usePlaybackState, State, Event, useTrackPlayerEvents, RepeatMode } from 'react-native-track-player';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import { VolumeManager } from 'react-native-volume-manager';
import { colors } from '../theme';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore, getThemeColors } from '../store/useThemeStore';

const { width, height } = Dimensions.get('window');
const events = [Event.PlaybackTrackChanged, Event.PlaybackError];

const Android16Slider = ({ value, maximumValue, onSlidingStart, onValueChange, onSlidingComplete }: any) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  
  const trackWidthRef = useRef(0);
  const maximumValueRef = useRef(maximumValue);
  const lastStartValRef = useRef(0);

  useEffect(() => { trackWidthRef.current = trackWidth; }, [trackWidth]);
  useEffect(() => { maximumValueRef.current = maximumValue; }, [maximumValue]);

  useEffect(() => {
    if (!isDragging) setLocalVal(value);
  }, [value, isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setIsDragging(true);
        if (onSlidingStart) onSlidingStart();
        const w = trackWidthRef.current;
        const max = maximumValueRef.current;
        if(w === 0) return;
        
        let val = Math.max(0, Math.min((e.nativeEvent.locationX / w) * max, max));
        lastStartValRef.current = val;
        setLocalVal(val);
        if (onValueChange) onValueChange(val);
      },
      onPanResponderMove: (e, gestureState) => {
        const w = trackWidthRef.current;
        const max = maximumValueRef.current;
        if(w === 0) return;

        const deltaVal = (gestureState.dx / w) * max;
        let newVal = Math.max(0, Math.min(lastStartValRef.current + deltaVal, max));
        setLocalVal(newVal);
        if (onValueChange) onValueChange(newVal);
      },
      onPanResponderRelease: (e, gestureState) => {
        setIsDragging(false);
        const w = trackWidthRef.current;
        const max = maximumValueRef.current;
        if(w === 0) return;

        const deltaVal = (gestureState.dx / w) * max;
        let newVal = Math.max(0, Math.min(lastStartValRef.current + deltaVal, max));
        if (onSlidingComplete) onSlidingComplete(newVal);
      }
    })
  ).current;

  const percentage = maximumValue > 0 ? (localVal / maximumValue) * 100 : 0;

  return (
    <View 
      style={{ height: 40, justifyContent: 'center', marginVertical: 10 }} 
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={{ height: 16, backgroundColor: '#222', borderRadius: 12, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', width: `${percentage}%`, backgroundColor: colors.accent, borderRadius: 12 }} />
      </View>
    </View>
  );
};

export default function PlayerScreen({ navigation }: any) {
  const { currentSong, setCurrentSong, toggleFavorite, playlists, queue, setQueue, addToPlaylist } = usePlayerStore();
  const { isDarkMode } = useThemeStore();
  const theme = getThemeColors(isDarkMode);

  const progress = useProgress();
  const state = usePlaybackState();
  const isPlaying = (state as any)?.state === State.Playing || state === State.Playing;
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
  const [volume, setVolume] = useState(0.8);
  const [showOptions, setShowOptions] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);

  const customPlaylists = Object.keys(playlists).filter(key => key !== 'My Favorites');
  
  const optionsAnim = useRef(new Animated.Value(height)).current;
  const isLiked = playlists['My Favorites']?.some(s => s.id === currentSong?.id);

  useTrackPlayerEvents(events, async (event) => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) setCurrentSong(track as any);
    }
  });

  useEffect(() => {
    VolumeManager.getVolume().then((v: any) => setVolume(typeof v === 'number' ? v : v.volume));
    const volSub = VolumeManager.addVolumeListener((result) => {
      setVolume(result.volume);
    });
    return () => volSub.remove();
  }, []);

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
    const nextMode = repeatMode === RepeatMode.Off ? RepeatMode.Queue : RepeatMode.Off;
    setRepeatMode(nextMode);
    await TrackPlayer.setRepeatMode(nextMode);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    VolumeManager.setVolume(value);
  };

  const onSeekStart = () => setIsSeeking(true);
  
  const onSeekValueChange = (v: number) => setSeekPos(v);
  
  const onSeekEnd = async (v: number) => {
    await TrackPlayer.seekTo(v);
    // Add delay before resolving seek to prevent UI jump from native lag
    setTimeout(() => {
      setIsSeeking(false);
    }, 600);
  };

  const openOptions = () => {
    setShowOptions(true);
    Animated.spring(optionsAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }).start();
  };

  const closeOptions = () => {
    Animated.timing(optionsAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(() => setShowOptions(false));
  };

  const formatTitle = (text: string) => {
    return text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
  };

  if (!currentSong) return null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Icon name="chevron-down" size={32} color={theme.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.npLabel, { color: theme.textMuted }]}>NOW PLAYING</Text>
        <TouchableOpacity onPress={openOptions}>
           <Icon name="ellipsis-vertical" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.artSection}>
        <View style={[styles.artGlow, { backgroundColor: isPlaying ? colors.accent : (isDarkMode ? '#222' : '#AAA') }]} />
        <View style={styles.artWrapper}>
          <Image source={{ uri: currentSong.artwork }} style={styles.art} />
        </View>
      </View>

      <View style={styles.metaSection}>
        <View style={styles.metaLeft}>
           <Text style={[styles.trackName, { color: theme.text }]} numberOfLines={1}>{formatTitle(currentSong.title).toUpperCase()}</Text>
           <Text style={[styles.trackArtist, { color: theme.textMuted }]}>{currentSong.artist.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(currentSong)}>
           <Icon name={isLiked ? "heart" : "heart-outline"} size={32} color={isLiked ? colors.accent2 : "#444"} />
        </TouchableOpacity>
      </View>

      <View style={styles.progSection}>
        <Android16Slider
          value={isSeeking ? seekPos : progress.position}
          maximumValue={progress.duration || 1}
          onSlidingStart={onSeekStart}
          onValueChange={onSeekValueChange}
          onSlidingComplete={onSeekEnd}
        />
        <View style={styles.timeWrapper}>
          <Text style={[styles.timeText, { color: theme.textMuted }]}>{new Date((isSeeking ? seekPos : progress.position) * 1000).toISOString().substring(14, 19)}</Text>
          <Text style={[styles.timeText, { color: theme.textMuted }]}>{new Date(progress.duration * 1000).toISOString().substring(14, 19)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handleShuffle} style={styles.subCtrl}><Icon name="shuffle" size={22} color={isShuffle ? colors.accent : theme.textMuted} /></TouchableOpacity>
        <TouchableOpacity onPress={skipPrev}><Icon name="play-skip-back" size={28} color={theme.text} /></TouchableOpacity>
        <TouchableOpacity onPress={togglePlayback} style={styles.playBtn}>
           <Icon name={isPlaying ? "pause" : "play"} size={32} color="#000" style={!isPlaying && { marginLeft: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={skipNext}><Icon name="play-skip-forward" size={28} color={theme.text} /></TouchableOpacity>
        <TouchableOpacity onPress={handleRepeat} style={styles.subCtrl}>
          <Icon name={repeatMode === RepeatMode.Track ? "repeat" : "repeat-outline"} size={22} color={repeatMode !== RepeatMode.Off ? colors.accent : theme.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.volumeRow}>
        <Icon name="volume-low" size={18} color={theme.textMuted} />
        <View style={{ flex: 1, marginHorizontal: 15 }}>
          <Android16Slider
            value={volume}
            maximumValue={1}
            onValueChange={handleVolumeChange}
          />
        </View>
        <Icon name="volume-high" size={20} color={theme.textMuted} />
      </View>
      </View>

      <Modal visible={showOptions} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeOptions} />
          <Animated.View style={[styles.optionsPanel, { transform: [{ translateY: optionsAnim }] }]}>
            <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor="#111" />
            <View style={styles.panelHeader}><View style={styles.dragHandle} /><TouchableOpacity onPress={closeOptions} style={styles.closePanel}><Icon name="close" size={24} color="#FFF" /></TouchableOpacity></View>
            <View style={styles.panelInfo}><Image source={{ uri: currentSong.artwork }} style={styles.smallArt} /><View><Text style={styles.panelTitle} numberOfLines={1}>{formatTitle(currentSong.title)}</Text><Text style={styles.panelArtist}>{currentSong.artist}</Text></View></View>
            <TouchableOpacity style={styles.optionItem} onPress={() => { Share.share({ message: `Listen to ${currentSong.title} on MUSIC!` }); closeOptions(); }}><Icon name="share-social-outline" size={22} color={colors.accent} /><Text style={styles.optionText}>Share Song</Text></TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => { toggleFavorite(currentSong); closeOptions(); }}><Icon name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? colors.accent2 : colors.text} /><Text style={styles.optionText}>{isLiked ? "Remove from Favorites" : "Add to Favorites"}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => { closeOptions(); setTimeout(() => setShowPlaylistSelector(true), 300); }}><Icon name="list-outline" size={22} color="#FFF" /><Text style={styles.optionText}>Add to Playlist</Text></TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showPlaylistSelector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPlaylistSelector(false)} />
          <View style={[styles.playlistPanel, { maxHeight: height * 0.6 }]}>
            <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor="#111" />
            <View style={styles.panelHeader}>
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.plHeaderRow}>
              <Text style={styles.plHeaderTitle}>Add to Playlist</Text>
              <TouchableOpacity onPress={() => setShowPlaylistSelector(false)} style={styles.plCloseBtn}>
                <Icon name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
            {customPlaylists.length === 0 ? (
              <View style={styles.plEmptyState}>
                <Icon name="albums-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={styles.plEmptyText}>No playlists yet</Text>
                <Text style={styles.plEmptySubtext}>Create a playlist from the home screen</Text>
              </View>
            ) : (
              customPlaylists.map(pName => (
                <TouchableOpacity
                  key={pName}
                  style={styles.plItem}
                  onPress={() => { addToPlaylist(pName, currentSong); setShowPlaylistSelector(false); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.plItemIcon}>
                    <Icon name="musical-notes" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.plItemInfo}>
                    <Text style={styles.plItemName}>{pName}</Text>
                    <Text style={styles.plItemCount}>{playlists[pName]?.length || 0} songs</Text>
                  </View>
                  <Icon name="add-circle-outline" size={24} color={colors.accent} />
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 20 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: 640, flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 10 },
  npLabel: { fontSize: 10, letterSpacing: 4, color: '#444', fontWeight: '800' },
  artSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  artGlow: { position: 'absolute', width: Math.min(width * 0.78, 400), height: Math.min(width * 0.78, 400), borderRadius: Math.min(width * 0.78, 400) / 2, opacity: 0.15 },
  artWrapper: { width: Math.min(width * 0.78, 400), height: Math.min(width * 0.78, 400), borderRadius: 32, overflow: 'hidden', elevation: 32, shadowColor: '#000', shadowOpacity: 0.9, shadowRadius: 40, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  art: { width: '100%', height: '100%' },
  metaSection: { paddingHorizontal: 28, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLeft: { flex: 1, marginRight: 20 },
  trackName: { fontFamily: Platform.OS === 'ios' ? 'Bebas Neue' : 'sans-serif-condensed', fontSize: 36, letterSpacing: 3, color: '#EFEFEF', fontWeight: '800', marginBottom: 6, lineHeight: 40 },
  trackArtist: { fontSize: 13, letterSpacing: 2.5, color: '#444', fontWeight: '800' },
  progSection: { paddingHorizontal: 28, marginBottom: 20 },
  slider: { width: '100%', height: 10 },
  timeWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { fontSize: 11, letterSpacing: 1, color: '#444', fontWeight: '900' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, height: 100 },
  playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  subCtrl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingBottom: 25, gap: 15 },
  volumeSlider: { flex: 1, height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  optionsPanel: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 50, paddingHorizontal: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'transparent' },
  panelHeader: { alignItems: 'center', paddingTop: 14, marginBottom: 24, zIndex: 2 },
  dragHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 },
  closePanel: { position: 'absolute', right: 0, top: 10, padding: 10 },
  panelInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 16, zIndex: 2 },
  smallArt: { width: 60, height: 60, borderRadius: 16 },
  panelTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  panelArtist: { color: '#E2D1C3', fontSize: 14, fontWeight: '600' },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', zIndex: 2 },
  optionText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  // Playlist selector panel
  playlistPanel: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'transparent' },
  plHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, zIndex: 2 },
  plHeaderTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', zIndex: 2 },
  plCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  plEmptyState: { alignItems: 'center', paddingVertical: 40, zIndex: 2 },
  plEmptyText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginTop: 16 },
  plEmptySubtext: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '500', marginTop: 6 },
  plItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', zIndex: 2 },
  plItemIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(226,209,195,0.1)', alignItems: 'center', justifyContent: 'center' },
  plItemInfo: { flex: 1 },
  plItemName: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  plItemCount: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
});

