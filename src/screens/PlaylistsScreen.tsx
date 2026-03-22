import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, StatusBar, Platform, Modal, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import TrackPlayer from 'react-native-track-player';
import { BlurView } from '@react-native-community/blur';
import { colors } from '../theme';
import { usePlayerStore } from '../store/usePlayerStore';
import { useThemeStore, getThemeColors } from '../store/useThemeStore';
import { Song } from '../types';
import MiniPlayer from '../components/MiniPlayer';

export default function PlaylistsScreen({ navigation }: any) {
  const { playlists, setCurrentSong, setQueue, createPlaylist, deletePlaylist, removeFromPlaylist } = usePlayerStore();
  const { isDarkMode } = useThemeStore();
  const theme = getThemeColors(isDarkMode);

  const [viewingPlaylist, setViewingPlaylist] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const customPlaylists = Object.keys(playlists).filter(key => key !== 'My Favorites');
  const viewingSongs = viewingPlaylist ? playlists[viewingPlaylist] || [] : [];

  const formatTitle = (text: string) => text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName('');
      setShowCreate(false);
    }
  };

  const playSong = async (song: Song) => {
    setCurrentSong(song);
    setQueue(viewingSongs);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(viewingSongs.map(s => ({ id: s.id, url: s.url, title: s.title, artist: s.artist, artwork: s.artwork, duration: s.duration })));
      const index = viewingSongs.findIndex(s => s.id === song.id);
      if (index !== -1) await TrackPlayer.skip(index);
      await TrackPlayer.play();
    } catch (e) { console.log(e); }
  };

  if (viewingPlaylist) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setViewingPlaylist(null)} style={styles.backBtn}>
            <Icon name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: theme.textMuted }]}>{viewingPlaylist.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => { deletePlaylist(viewingPlaylist); setViewingPlaylist(null); }} style={styles.backBtn}>
            <Icon name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {viewingSongs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="musical-notes-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.text }]}>Playlist is empty</Text>
          </View>
        ) : (
          <FlatList
            data={viewingSongs}
            keyExtractor={(item) => 'pl-song-' + item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.trackRow, { borderBottomColor: theme.border }]} onPress={() => playSong(item)}>
                <Image source={{ uri: item.artwork }} style={styles.trackArt} />
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>{formatTitle(item.title)}</Text>
                  <Text style={[styles.trackArtist, { color: theme.textMuted }]} numberOfLines={1}>{item.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFromPlaylist(viewingPlaylist, item.id)} style={styles.favBtn}>
                  <Icon name="remove-circle-outline" size={22} color="#EF4444" />
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textMuted }]}>PLAYLISTS</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.backBtn}>
          <Icon name="add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={customPlaylists}
        keyExtractor={(item) => 'pl-' + item}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.trackRow, { borderBottomColor: theme.border }]} onPress={() => setViewingPlaylist(item)}>
            {playlists[item].length > 0 && playlists[item][0].artwork ? (
              <Image source={{ uri: playlists[item][0].artwork }} style={styles.trackArt} />
            ) : (
              <View style={[styles.trackArt, { backgroundColor: isDarkMode ? '#1C1C1C' : '#EAEAEA', alignItems: 'center', justifyContent: 'center' }]}>
                <Icon name="albums" size={24} color={colors.accent} />
              </View>
            )}
            <View style={styles.trackInfo}>
              <Text style={[styles.trackTitle, { color: theme.text }]}>{item}</Text>
              <Text style={[styles.trackArtist, { color: theme.textMuted }]}>{playlists[item].length} Songs</Text>
            </View>
            {playlists[item].length > 0 && (
              <TouchableOpacity
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                onPress={() => {
                  setCurrentSong(playlists[item][0]);
                  setQueue(playlists[item]);
                  TrackPlayer.reset().then(() => {
                    TrackPlayer.add(playlists[item].map((s: any) => ({ id: s.id, url: s.url, title: s.title, artist: s.artist, artwork: s.artwork, duration: s.duration })));
                    TrackPlayer.play();
                  });
                }}
              >
                <Icon name="play" size={16} color="#000" />
              </TouchableOpacity>
            )}
            <Icon name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      />

      <MiniPlayer navigation={navigation} />

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor="#111" />
          <View style={styles.optionsPanel}>
            <Text style={styles.createPlTitle}>NEW PLAYLIST</Text>
            <TextInput
              style={styles.plInput}
              placeholder="Playlist name"
              placeholderTextColor="#666"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.plBtns}>
              <TouchableOpacity style={styles.plBtn} onPress={() => setShowCreate(false)}><Text style={styles.plBtnText}>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.plBtn, { backgroundColor: colors.accent }]} onPress={handleCreate}><Text style={[styles.plBtnText, { color: '#000' }]}>CREATE</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  trackArt: { width: 52, height: 52, borderRadius: 16 },
  trackInfo: { flex: 1, marginLeft: 16 },
  trackTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  trackArtist: { fontSize: 12, fontWeight: '600' },
  favBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  optionsPanel: { backgroundColor: '#141414', borderRadius: 28, padding: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  createPlTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  plInput: { backgroundColor: '#0D0D0D', color: '#FFF', borderWidth: 1, borderColor: '#333', borderRadius: 12, height: 50, paddingHorizontal: 15, marginBottom: 20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  plBtns: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  plBtn: { flex: 1, height: 45, borderRadius: 10, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  plBtnText: { color: '#FFF', fontWeight: '800', letterSpacing: 2, fontSize: 12 }
});
