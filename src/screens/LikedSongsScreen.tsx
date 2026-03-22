import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import TrackPlayer from 'react-native-track-player';
import { colors } from '../theme';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore, getThemeColors } from '../store/useThemeStore';
import { Song } from '../types';
import MiniPlayer from '../components/MiniPlayer';

export default function LikedSongsScreen({ navigation }: any) {
  const { playlists, toggleFavorite, setCurrentSong, setQueue } = usePlayerStore();
  const { isDarkMode } = useThemeStore();
  const theme = getThemeColors(isDarkMode);
  const likedSongs = playlists['My Favorites'] || [];

  const formatTitle = (text: string) => text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");

  const playSong = async (song: Song) => {
    setCurrentSong(song);
    setQueue(likedSongs);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(likedSongs.map(s => ({ id: s.id, url: s.url, title: s.title, artist: s.artist, artwork: s.artwork, duration: s.duration })));
      const index = likedSongs.findIndex(s => s.id === song.id);
      if (index !== -1) await TrackPlayer.skip(index);
      await TrackPlayer.play();
    } catch (e) { console.log(e); }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textMuted }]}>LIKED SONGS</Text>
        <View style={{ width: 44 }} />
      </View>

      {likedSongs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No liked songs yet</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>Songs you like will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={likedSongs}
          keyExtractor={(item) => 'liked-' + item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.trackRow, { borderBottomColor: theme.border }]} onPress={() => playSong(item)}>
              <Image source={{ uri: item.artwork }} style={styles.trackArt} />
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>{formatTitle(item.title)}</Text>
                <Text style={[styles.trackArtist, { color: theme.textMuted }]} numberOfLines={1}>{item.artist}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.favBtn}>
                <Icon name="heart" size={22} color={colors.accent2} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
      <MiniPlayer navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: 640, flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 12, letterSpacing: 4, fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', marginTop: 20 },
  emptySub: { fontSize: 13, fontWeight: '500', marginTop: 8, textAlign: 'center' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  trackArt: { width: 52, height: 52, borderRadius: 16 },
  trackInfo: { flex: 1, marginLeft: 16 },
  trackTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  trackArtist: { fontSize: 12, fontWeight: '600' },
  favBtn: { padding: 8 },
});
