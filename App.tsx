import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer, { Capability, AppKilledPlaybackBehavior } from 'react-native-track-player';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { colors } from './src/theme';
import { useAuthStore } from './src/store/useAuthStore';
import { usePlayerStore } from './src/store/usePlayerStore';
import { useThemeStore } from './src/store/useThemeStore';

let isPlayerInitialized = false;

function App(): React.JSX.Element {
  const { initialize, initialized } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    async function setup() {
      await initialize();
      useThemeStore.getState().loadTheme();
      usePlayerStore.getState().fetchFavorites();
      usePlayerStore.getState().fetchPlaylists();
      
      if (isPlayerInitialized) return;
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          alwaysPauseOnInterruption: true,
          progressUpdateEventInterval: 1,
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification
          },
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
        });
        isPlayerInitialized = true;
      } catch (e) {
        console.log('Player setup error', e);
      }
    }
    setup();
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? colors.surface : '#FAFAFA'} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
