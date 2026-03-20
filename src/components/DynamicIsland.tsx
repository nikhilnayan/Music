import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { State, usePlaybackState } from 'react-native-track-player';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

export const DynamicIsland = ({ onPress, onSearchPress }: { onPress: () => void, onSearchPress: () => void }) => {
  const { currentSong } = usePlayerStore();
  const state = usePlaybackState();
  const isPlaying = state === State.Playing;

  if (!currentSong) {
    // Fallback if no song: search only
    return (
      <View style={styles.fixedContainer}>
        <TouchableOpacity style={styles.island} onPress={onSearchPress}>
          <Icon name="search" size={20} color={colors.primary} />
          <Text style={styles.searchPrompt}>Search your music...</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fixedContainer}>
      <View style={styles.island}>
        {/* 80% Playback Info Area */}
        <TouchableOpacity style={styles.playbackArea} onPress={onPress}>
          <Image source={{ uri: currentSong.artwork }} style={styles.artwork} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
          </View>
          <View style={styles.miniVisualizer}>
             {isPlaying ? (
                <View style={styles.dot} />
             ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 20% Search Trigger Area */}
        <TouchableOpacity style={styles.searchArea} onPress={onSearchPress}>
           <Icon name="search" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedContainer: {
    position: 'absolute',
    bottom: 110, // Sits above bottom tabs
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  island: {
    width: '92%',
    height: 72,
    backgroundColor: '#0D0D0D', // Very dark Charcoal/Black
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 209, 195, 0.15)', // Sand highlight border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  playbackArea: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  searchArea: {
    flex: 0.2,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  searchPrompt: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  artist: {
    color: colors.primary, // Sand color for artist
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  miniVisualizer: {
    paddingHorizontal: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  }
});
