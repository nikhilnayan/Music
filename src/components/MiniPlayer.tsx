import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import TrackPlayer, { usePlaybackState, State, useProgress } from 'react-native-track-player';
import { usePlayerStore } from '../store/usePlayerStore';
import { colors } from '../theme';

export default function MiniPlayer({ navigation }: { navigation: any }) {
  const { currentSong } = usePlayerStore();
  const playbackState = usePlaybackState();
  const isPlaying = (playbackState as any)?.state === State.Playing || playbackState === State.Playing;
  const progress = useProgress();

  if (!currentSong) return null;

  const toggleMiniPlay = async () => {
    isPlaying ? await TrackPlayer.pause() : await TrackPlayer.play();
  };

  const formatTitle = (text: string) => {
    return text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
  };

  return (
    <TouchableOpacity style={styles.miniPlayer} activeOpacity={0.9} onPress={() => navigation.navigate('Player')}>
      <BlurView style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} blurType="dark" blurAmount={25} reducedTransparencyFallbackColor="#111" />
      <Image source={{ uri: currentSong.artwork }} style={styles.miniArt} />
      <View style={styles.miniInfo}>
        <Text style={styles.miniTitle} numberOfLines={1}>{formatTitle(currentSong.title)}</Text>
        <Text style={styles.miniArtist} numberOfLines={1}>{currentSong.artist}</Text>
      </View>
      <View style={styles.miniControls}>
         <TouchableOpacity style={styles.miniPlayBtn} onPress={toggleMiniPlay}>
            <Icon name={isPlaying ? "pause" : "play"} size={26} color={colors.accent} />
         </TouchableOpacity>
      </View>
      <View style={styles.miniProgContainer}>
        <View style={[styles.miniProgFill, { width: `${(progress.position / (progress.duration || 1)) * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  miniPlayer: { position: 'absolute', bottom: 30, left: 18, right: 18, height: 82, backgroundColor: 'transparent', borderRadius: 28, borderWidth: 1, borderColor: '#1C1C1C', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, zIndex: 1000, elevation: 25, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 15, overflow: 'hidden' },
  miniArt: { width: 56, height: 56, borderRadius: 16 },
  miniInfo: { flex: 1, marginLeft: 18 },
  miniTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  miniArtist: { color: '#444', fontSize: 12, marginTop: 4, fontWeight: '600' },
  miniControls: { flexDirection: 'row', alignItems: 'center' },
  miniPlayBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  miniProgContainer: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1.5 },
  miniProgFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 1.5 },
});
