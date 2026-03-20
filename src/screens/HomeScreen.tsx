import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Dimensions, StatusBar, SafeAreaView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TrackPlayer, { usePlaybackState, State, useProgress } from 'react-native-track-player';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme';
import { searchSongsOnJioSaavn } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Song[]>([]);
  
  const { currentSong, setCurrentSong, setQueue, toggleFavorite, playlists } = usePlayerStore();
  const playbackState = usePlaybackState();
  const isPlaying = (playbackState as any)?.state === State.Playing || playbackState === State.Playing;
  const progress = useProgress();

  useEffect(() => {
    if (results.length === 0 && !loading) {
        handleSearch('Latest Hits'); 
    }
  }, []);

  useEffect(() => {
    if (query.trim().length >= 3) {
      const timeout = setTimeout(() => handleSearch(query), 500);
      return () => clearTimeout(timeout);
    }
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const apiSongs = await searchSongsOnJioSaavn(searchQuery);
      setResults(apiSongs);
      setQueue(apiSongs);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const playSong = async (song: Song) => {
    setCurrentSong(song);
    setQueue(results);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(results.map(s => ({
        id: s.id,
        url: s.url,
        title: s.title,
        artist: s.artist,
        artwork: s.artwork,
      })));
      const index = results.findIndex(s => s.id === song.id);
      if (index !== -1) await TrackPlayer.skip(index);
      await TrackPlayer.play();
    } catch (e) {
      console.log(e);
    }
  };

  const toggleMiniPlay = async () => {
    isPlaying ? await TrackPlayer.pause() : await TrackPlayer.play();
  };

  const formatTitle = (text: string) => {
    return text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
  };

  const isLiked = (song: Song) => playlists['My Favorites']?.some(s => s.id === song.id);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#060606" />
      
      {/* 1. BRANDING HEADER */}
      <View style={styles.logoHeader}>
        <Text style={styles.logoText}>MUSIC</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => handleSearch('Trending')}>
             <Icon name="pulse-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* 2. SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={18} color="#444" />
          <TextInput
            style={styles.searchInput}
            placeholder="Artists, songs, podcasts…"
            placeholderTextColor="#444"
            value={query}
            onChangeText={setQuery}
          />
          {loading && <ActivityIndicator size="small" color={colors.accent} />}
        </View>

        {/* 3. FEATURED LIST (Previously Discover) */}
        <View style={styles.secHeader}>
          <Text style={styles.secLabel}>FEATURED FLOWS</Text>
          <TouchableOpacity onPress={() => handleSearch('Top Charts')}>
            <Text style={styles.seeAll}>REFRESH →</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={results.slice(0, 5)}
          keyExtractor={(item) => 'feat-' + item.id}
          contentContainerStyle={styles.horizontalScroll}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.albumCard} onPress={() => playSong(item)}>
              <View style={styles.albumArtWrapper}>
                <Image source={{ uri: item.artwork }} style={styles.albumArt} />
                <View style={styles.playBadge}>
                  <Icon name="play" size={14} color="#000" />
                </View>
              </View>
              <Text style={styles.albumTitle} numberOfLines={1}>{formatTitle(item.title)}</Text>
              <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
            </TouchableOpacity>
          )}
        />

        {/* 4. TRENDING LIST */}
        <View style={styles.secHeader}>
          <Text style={styles.secLabel}>TRENDING NOW</Text>
          <TouchableOpacity onPress={() => handleSearch('New Releases')}>
             <Text style={styles.seeAll}>NEW →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trackList}>
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={styles.trackRow} onPress={() => playSong(item)}>
              <Image source={{ uri: item.artwork }} style={styles.trackArt} />
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{formatTitle(item.title)}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
              </View>
              <View style={styles.trackMeta}>
                <TouchableOpacity onPress={() => toggleFavorite(item)}>
                  <Icon 
                    name={isLiked(item) ? "heart" : "heart-outline"} 
                    size={20} 
                    color={isLiked(item) ? colors.accent2 : "#444"} 
                  />
                </TouchableOpacity>
                <Text style={styles.trackDur}>3:45</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 5. MINI PLAYER (Replaces Tab Bar section) */}
      {currentSong && (
        <TouchableOpacity 
          style={styles.miniPlayer} 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Player')}
        >
          <Image source={{ uri: currentSong.artwork }} style={styles.miniArt} />
          <View style={styles.miniInfo}>
            <Text style={styles.miniTitle} numberOfLines={1}>{formatTitle(currentSong.title)}</Text>
            <Text style={styles.miniArtist} numberOfLines={1}>{currentSong.artist}</Text>
          </View>
          <View style={styles.miniControls}>
             <TouchableOpacity onPress={async () => { try { await TrackPlayer.skipToPrevious(); } catch (e) {} }}>
                <Icon name="play-skip-back" size={20} color="#444" />
             </TouchableOpacity>
             <TouchableOpacity style={styles.miniPlayBtn} onPress={toggleMiniPlay}>
                <Icon name={isPlaying ? "pause" : "play"} size={22} color={colors.accent} />
             </TouchableOpacity>
             <TouchableOpacity onPress={async () => { try { await TrackPlayer.skipToNext(); } catch (e) {} }}>
                <Icon name="play-skip-forward" size={20} color="#444" />
             </TouchableOpacity>
          </View>
          {/* Mini progress bar at the bottom */}
          <View style={styles.miniProgContainer}>
             <View style={[styles.miniProgFill, { width: `${(progress.position / progress.duration) * 100}%` }]} />
          </View>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060606' },
  logoHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingTop: 10, 
    paddingBottom: 20 
  },
  logoText: { 
    fontFamily: Platform.OS === 'ios' ? 'Bebas Neue' : 'sans-serif-condensed', 
    fontSize: 32, 
    letterSpacing: 8, 
    color: colors.accent,
    fontWeight: '900'
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: colors.accent, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: 18
  },
  avatarText: { fontSize: 10, fontWeight: '900', color: '#000' },
  searchContainer: {
    marginHorizontal: 24,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1C1C1C',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    height: 48,
    marginBottom: 24
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    color: '#EFEFEF', 
    fontSize: 12, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  },
  secHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 14 
  },
  secLabel: { fontSize: 10, letterSpacing: 3, color: '#444', fontWeight: '800' },
  seeAll: { fontSize: 10, color: colors.accent, fontWeight: '800' },
  horizontalScroll: { paddingLeft: 24, paddingRight: 10, marginBottom: 28 },
  albumCard: { width: 140, marginRight: 16 },
  albumArtWrapper: { 
    width: 140, 
    height: 140, 
    borderRadius: 14, 
    overflow: 'hidden', 
    marginBottom: 10,
    backgroundColor: '#141414',
    position: 'relative'
  },
  albumArt: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  albumTitle: { color: '#EFEFEF', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  albumArtist: { color: '#444', fontSize: 10, fontWeight: '600' },
  trackList: { paddingHorizontal: 24 },
  trackRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1C1C1C' 
  },
  trackArt: { width: 46, height: 46, borderRadius: 8, backgroundColor: '#141414' },
  trackInfo: { flex: 1, marginLeft: 14 },
  trackTitle: { color: '#EFEFEF', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  trackArtist: { color: '#444', fontSize: 10 },
  trackMeta: { alignItems: 'flex-end', gap: 6 },
  trackDur: { fontSize: 10, color: '#444' },
  
  // MINI PLAYER STYLES
  miniPlayer: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    height: 72,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 1000,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  miniArt: { width: 48, height: 48, borderRadius: 10 },
  miniInfo: { flex: 1, marginLeft: 14 },
  miniTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  miniArtist: { color: '#444', fontSize: 11, marginTop: 2 },
  miniControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  miniPlayBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  miniProgContainer: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 1
  },
  miniProgFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 1 },
  scroll: { paddingBottom: 120 }
});
