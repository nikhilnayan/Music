import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, Switch, TextInput, ScrollView, Modal, Animated } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, getThemeColors } from '../store/useThemeStore';
import { supabase } from '../services/supabase';

export default function ProfileScreen({ navigation }: any) {
  const { session, signOut } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const theme = getThemeColors(isDarkMode);

  const currentName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || '';
  const currentEmail = session?.user?.email || '';
  const getInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'U';
    return nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const [editModal, setEditModal] = useState<'name' | 'email' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  
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

  const openEdit = (type: 'name' | 'email') => {
    setInputValue(type === 'name' ? currentName : currentEmail);
    setEditModal(type);
  };

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    if (editModal === 'email' && !inputValue.includes('@')) {
      showToast('Please enter a valid email.');
      return;
    }
    
    setSaving(true);
    try {
      const updateData = editModal === 'name' 
        ? { data: { full_name: inputValue.trim() } }
        : { email: inputValue.trim() };
        
      const { error } = await supabase.auth.updateUser(updateData);
      if (error) {
        showToast(`${error.message}`);
      } else {
        showToast(editModal === 'name' ? 'Name updated successfully.' : 'Confirmation link sent.');
        setEditModal(null);
      }
    } catch (e) {
      showToast('Failed to update.');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    import('react-native-track-player').then(RNTP => RNTP.default.reset().catch(() => {}));
    const pStore = import('../store/usePlayerStore').then(s => {
      s.usePlayerStore.getState().setCurrentSong(null);
      s.usePlayerStore.getState().setQueue([]);
    });
    await signOut();
  };

  const cardBg = isDarkMode ? '#0D0D0D' : '#F5F5F5';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={styles.container}>
      {toastMsg ? (
        <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }], backgroundColor: isDarkMode ? '#1C1C1C' : '#FFF', borderColor: theme.border }]}>
          <Text style={[styles.toastText, { color: theme.text }]}>{toastMsg}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textMuted }]}>PROFILE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials(currentName)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.fieldRow} onPress={() => openEdit('name')}>
            <View style={styles.fieldIcon}>
              <Icon name="person-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Display Name</Text>
              <Text style={[styles.fieldValue, { color: theme.text }]}>{currentName || 'Not set'}</Text>
            </View>
            <Icon name="pencil" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.fieldRow} onPress={() => openEdit('email')}>
            <View style={styles.fieldIcon}>
              <Icon name="mail-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Email</Text>
              <Text style={[styles.fieldValue, { color: theme.text }]}>{currentEmail}</Text>
            </View>
            <Icon name="pencil" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <View style={[styles.fieldRow, { alignItems: 'center' }]}>
            <View style={styles.fieldIcon}>
              <Icon name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.accent} />
            </View>
            <View style={[styles.fieldContent, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={[styles.fieldValue, { color: theme.text }]}>Dark Mode</Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#444', true: colors.accent }}
                thumbColor={'#FFF'}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Icon name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Made for you 💖</Text>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditModal(null)} />
          <View style={[styles.editPanel, { backgroundColor: isDarkMode ? '#111' : '#FFF', borderColor: theme.border }]}>
            <Text style={[styles.editTitle, { color: theme.text }]}>
              Edit {editModal === 'name' ? 'Name' : 'Email'}
            </Text>
            <TextInput
              style={[styles.editInput, { color: theme.text, backgroundColor: isDarkMode ? '#1C1C1C' : '#F5F5F5', borderColor: theme.border }]}
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
              placeholderTextColor={theme.textMuted}
              keyboardType={editModal === 'email' ? 'email-address' : 'default'}
              autoCapitalize={editModal === 'email' ? 'none' : 'words'}
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setEditModal(null)}>
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={handleSave} disabled={saving}>
                <Text style={[styles.actionBtnText, { color: '#000' }]}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
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
  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { fontSize: 36, fontWeight: '900', color: '#000' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginLeft: 40, marginBottom: 10, marginTop: 24 },
  card: { marginHorizontal: 24, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18 },
  fieldIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(226,209,195,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: '700' },
  divider: { height: 1, marginLeft: 76 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 36, marginHorizontal: 24, height: 56, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.06)' },
  signOutText: { color: '#EF4444', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  footerText: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  editPanel: { padding: 24, borderRadius: 28, borderWidth: 1 },
  editTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  editInput: { height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  actionBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  actionBtnText: { fontSize: 14, fontWeight: '800' },
  toast: { position: 'absolute', top: 0, left: 24, right: 24, zIndex: 1000, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  toastText: { fontSize: 14, fontWeight: '700', textAlign: 'center' }
});
