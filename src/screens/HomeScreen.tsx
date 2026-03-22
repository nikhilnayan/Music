import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Dimensions, StatusBar, SafeAreaView, Platform, PanResponder, Animated } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TrackPlayer, { usePlaybackState, State, useProgress, useTrackPlayerEvents, Event } from 'react-native-track-player';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme';
import { searchSongsOnJioSaavn } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, getThemeColors } from '../store/useThemeStore';
import { Song } from '../types';
import MiniPlayer from '../components/MiniPlayer';

const { width } = Dimensions.get('window');
const CONTENT_MAX_WIDTH = 600;
const TILE_HEIGHT = (Math.min(width, CONTENT_MAX_WIDTH) - 28 * 2 - 12) * 1.2;

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Song[]>([]);

  const { session } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const theme = getThemeColors(isDarkMode);

  const { currentSong, setCurrentSong, setQueue, toggleFavorite, playlists, fetchFavorites, fetchPlaylists } = usePlayerStore();
  const playbackState = usePlaybackState();
  const isPlaying = (playbackState as any)?.state === State.Playing || playbackState === State.Playing;
  const progress = useProgress();

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Music User';
  const getInitials = (nameStr: string) => nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const likedSongs = playlists['My Favorites'] || [];
  
  const [homeTracks, setHomeTracks] = useState<Song[]>([]);
  const [homeTracksTitle, setHomeTracksTitle] = useState('Trending now');
  const [toastMsg, setToastMsg] = useState('');
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 60, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start(() => setToastMsg(''));
  };

  const getHistoryKey = () => `listeningHistory_${session?.user?.id || 'guest'}`;

  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event: any) => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) {
        setCurrentSong(track as any);
        saveToHistory(track as any);
      }
    }
  });

  const saveToHistory = async (song: Song) => {
    try {
      const key = getHistoryKey();
      const res = await AsyncStorage.getItem(key);
      let hist: Song[] = res ? JSON.parse(res) : [];
      let newHist = [song, ...hist.filter(s => s.id !== song.id)].slice(0, 15);
      await AsyncStorage.setItem(key, JSON.stringify(newHist));
      if (query.trim().length === 0) {
        setHomeTracksTitle('Recently Played');
        setHomeTracks(newHist);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchFavorites();
    fetchPlaylists();
    AsyncStorage.getItem(getHistoryKey()).then(res => {
      let hist = res ? JSON.parse(res) : [];
      if (hist.length > 0) {
        setHomeTracksTitle('Recently Played');
        setHomeTracks(hist);
      } else {
        const queries = ['trending hindi top', 'bollywood hits', 'new releases english', 'lofi pop', 'top romantic', 'punjabi hits', 'electronic dance'];
        const randQ = queries[Math.floor(Math.random() * queries.length)];
        searchSongsOnJioSaavn(randQ).then((songs: Song[]) => {
          setHomeTracksTitle('Trending for You');
          setHomeTracks(songs);
        });
      }
    });
  }, [session?.user?.id]);

  useEffect(() => {
    if (query.trim().length >= 3) {
      const timeout = setTimeout(() => handleSearch(query), 500);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
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

  const playSong = async (song: Song, fromQueue: Song[] = results) => {
    setCurrentSong(song);
    saveToHistory(song);
    setQueue(fromQueue);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(fromQueue.map(s => ({
        id: s.id,
        url: s.url,
        title: s.title,
        artist: s.artist,
        artwork: s.artwork,
        duration: s.duration,
      })));
      const index = fromQueue.findIndex(s => s.id === song.id);
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '3:45';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const isLikedValue = (song: Song) => playlists['My Favorites']?.some(s => s.id === song.id);

  const panAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const animateSwipe = async (direction: 'left' | 'right') => {
    Animated.parallel([
      Animated.timing(panAnim, { toValue: direction === 'left' ? -width : width, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(async () => {
      try {
        if (direction === 'left') await TrackPlayer.skipToNext();
        else await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();

        const trackId = await TrackPlayer.getCurrentTrack();
        if (trackId != null) {
          const track = await TrackPlayer.getTrack(trackId as number);
          if (track) setCurrentSong(track as any);
        }
      } catch (e) { }

      panAnim.setValue(direction === 'left' ? width / 2 : -width / 2);
      Animated.parallel([
        Animated.spring(panAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: Animated.event([null, { dx: panAnim }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 60) {
          animateSwipe('right');
        } else if (gestureState.dx < -60) {
          animateSwipe('left');
        } else {
          Animated.spring(panAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(panAnim, { toValue: 0, useNativeDriver: true }).start()
    })
  ).current;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      <View style={styles.container}>
        <View style={styles.logoHeader}>
          <Text style={styles.logoText}>MUSIC</Text>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={[styles.avatarText, { color: '#000' }]}>{getInitials(userName)}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#0D0D0D' : '#F5F5F5', borderColor: theme.border }]}>
            <Icon name="search-outline" size={22} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search for any song, artist..."
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
            />
            {loading && <ActivityIndicator size="small" color={colors.accent} />}
            {query.trim().length > 0 && !loading && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} style={styles.clearBtn}>
                <Icon name="close-circle" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

        {query.trim().length > 0 ? (
          <View style={styles.trackList}>
            {results.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.trackRow, { borderBottomColor: theme.border }]} onPress={() => playSong(item, [item])}>
                <Image source={{ uri: item.artwork }} style={styles.trackArt} />
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>{formatTitle(item.title)}</Text>
                  <Text style={[styles.trackArtist, { color: theme.textMuted }]} numberOfLines={1}>{item.artist}</Text>
                </View>
                <View style={styles.trackMeta}>
                  <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.favBtnHome}>
                    <Icon name={isLikedValue(item) ? "heart" : "heart-outline"} size={22} color={isLikedValue(item) ? colors.accent2 : theme.textMuted} />
                  </TouchableOpacity>
                  <Text style={[styles.trackDur, { color: theme.textMuted }]}>{formatDuration(item.duration)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.minimalBody}>
            {currentSong ? (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.npCardVertical,
                  {
                    height: TILE_HEIGHT,
                    backgroundColor: isDarkMode ? '#111111' : '#F0F0F0',
                    borderColor: theme.border,
                    transform: [{ translateX: panAnim }],
                    opacity: opacityAnim
                  }
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Player')}
                  style={styles.npCardInner}
                >
                  <View style={styles.npThumbWrapper}>
                    <Image source={{ uri: currentSong.artwork }} style={styles.npThumbVert} />
                    <TouchableOpacity style={[styles.npPlayBtnSmall, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }]} onPress={toggleMiniPlay}>
                      <Icon name={isPlaying ? 'pause' : 'play'} size={16} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.npInfoVert}>
                    <Text style={[styles.npTitleVert, { color: theme.text }]} numberOfLines={1}>{formatTitle(currentSong.title)}</Text>
                    <Text style={[styles.npArtistVert, { color: theme.textMuted }]} numberOfLines={1}>{currentSong.artist}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ) : null}

            <View style={styles.tilesRow}>
              <TouchableOpacity style={[styles.bigTile, { backgroundColor: theme.tileBg, borderColor: theme.border }]} onPress={() => navigation.navigate('LikedSongs')}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="heart" size={48} color={colors.accent2} />
                </View>
                <Text style={[styles.tileTitle, { color: theme.text }]}>Liked Songs</Text>
                <Text style={[styles.tileSub, { color: theme.textMuted }]}>{likedSongs.length} Tracks</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.bigTile, { backgroundColor: theme.tileBg, borderColor: theme.border }]} onPress={() => navigation.navigate('Playlists')}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="albums" size={48} color={colors.accent} />
                </View>
                <Text style={[styles.tileTitle, { color: theme.text }]}>Playlists</Text>
                <Text style={[styles.tileSub, { color: theme.textMuted }]}>{Object.keys(playlists).length - 1} Custom</Text>
              </TouchableOpacity>
            </View>

            {homeTracks.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 2, color: theme.text, marginBottom: 15 }}>{homeTracksTitle.toUpperCase()}</Text>
                <View style={[styles.trackList, { paddingHorizontal: 0 }]}>
                  {homeTracks.map((item) => (
                    <TouchableOpacity key={'ht-'+item.id} style={[styles.trackRow, { borderBottomColor: theme.border, paddingHorizontal: 0, borderBottomWidth: 0, paddingVertical: 12 }]} onPress={() => playSong(item, homeTracks)}>
                      <Image source={{ uri: item.artwork }} style={styles.trackArt} />
                      <View style={styles.trackInfo}>
                        <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>{formatTitle(item.title)}</Text>
                        <Text style={[styles.trackArtist, { color: theme.textMuted }]} numberOfLines={1}>{item.artist}</Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.favBtnHome}>
                        <Icon name={isLikedValue(item) ? "heart" : "heart-outline"} size={22} color={isLikedValue(item) ? colors.accent2 : theme.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

          </View>
        )}
      </ScrollView>

      {query.trim().length > 0 && <MiniPlayer navigation={navigation} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060606', alignItems: 'center' },
  container: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, flex: 1 },
  logoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingTop: 15, paddingBottom: 25 },
  logoText: { fontFamily: Platform.OS === 'ios' ? 'Bebas Neue' : 'sans-serif-condensed', fontSize: 36, letterSpacing: 10, color: colors.accent, fontWeight: '900' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  avatarText: { fontSize: 12, fontWeight: '900', color: '#000' },
  searchContainer: { marginHorizontal: 28, backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#1C1C1C', borderRadius: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 56, marginBottom: 35 },
  searchInput: { flex: 1, marginLeft: 12, color: '#EFEFEF', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  clearBtn: { padding: 4, marginLeft: 8 },
  minimalBody: { paddingHorizontal: 28, marginTop: 10 },
  npCardVertical: { width: '100%', borderRadius: 28, borderWidth: 1, marginBottom: 22, overflow: 'hidden' },
  npCardInner: { flex: 1, padding: 14, flexDirection: 'column' },
  npThumbWrapper: { flex: 1, marginBottom: 2, width: '100%', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  npThumbVert: { width: '100%', height: '100%', borderRadius: 16, backgroundColor: '#222' },
  npPlayBtnSmall: { position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  npInfoVert: { alignItems: 'flex-start', paddingHorizontal: 4 },
  npTitleVert: { fontSize: 20, fontWeight: '800', marginBottom: 2, marginTop: 5 },
  npArtistVert: { fontSize: 13, fontWeight: '600' },
  tilesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bigTile: { width: '48%', aspectRatio: 1, backgroundColor: '#111', borderRadius: 28, padding: 20, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#1C1C1C' },
  tileTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  tileSub: { color: '#666', fontSize: 12, fontWeight: '600' },
  scroll: { paddingBottom: 50 },
  trackList: { paddingHorizontal: 28 },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#1C1C1C' },
  trackArt: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#141414' },
  trackInfo: { flex: 1, marginLeft: 18 },
  trackTitle: { color: '#EFEFEF', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  trackArtist: { color: '#444', fontSize: 13, fontWeight: '600' },
  trackMeta: { alignItems: 'flex-end', gap: 10 },
  favBtnHome: { padding: 5 },
  trackDur: { fontSize: 12, color: '#444', fontWeight: '800' },
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
