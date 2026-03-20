import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import TrackPlayer from 'react-native-track-player';

const { width, height } = Dimensions.get('window');

export default function PlaylistScreen() {
  const { playlists, setCurrentSong, setQueue } = usePlayerStore();
  const favoriteSongs = playlists['My Favorites'] || [];

  const playSong = async (song: any) => {
    setCurrentSong(song);
    setQueue(favoriteSongs);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(favoriteSongs.map((s: any) => ({
        id: s.id,
        url: s.url,
        title: s.title,
        artist: s.artist,
        artwork: s.artwork,
      })));
      const index = favoriteSongs.findIndex((s: any) => s.id === song.id);
      if (index !== -1) await TrackPlayer.skip(index);
      await TrackPlayer.play();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Background Accent */}
      <View style={styles.glowSpot} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <View style={styles.headerMeta}>
             <Icon name="heart-circle" size={32} color={colors.primary} />
             <Text style={styles.count}>{favoriteSongs.length} Tracks</Text>
          </View>
        </View>

        <FlatList
          data={favoriteSongs}
          keyExtractor={(item) => item.id + Math.random()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="musical-notes-outline" size={80} color="rgba(255,110,64,0.15)" />
              <Text style={styles.empty}>Your library is looking a bit empty.</Text>
              <Text style={styles.emptySub}>Add songs from discovery to see them here!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => playSong(item)} activeOpacity={0.8}>
              <Image source={{ uri: item.artwork }} style={styles.art} />
              <View style={styles.info}>
                <Text style={styles.songName} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artistName} numberOfLines={1}>{item.artist}</Text>
              </View>
              <View style={styles.playTag}>
                <Icon name="play-sharp" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  glowSpot: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  header: { padding: 24, paddingTop: 60, marginBottom: 10 },
  title: { color: '#ffffff', fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  count: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '700', marginLeft: 10 },
  list: { paddingHorizontal: 20, paddingBottom: 150 },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderRadius: 30,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  art: { width: 64, height: 64, borderRadius: 22 },
  info: { flex: 1, marginLeft: 18, justifyContent: 'center' },
  songName: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  artistName: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 },
  playTag: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,110,64,0.1)', alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
  empty: { color: '#ffffff', textAlign: 'center', marginTop: 24, fontSize: 18, fontWeight: '700' },
  emptySub: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10, fontSize: 14, fontWeight: '500' },
});
