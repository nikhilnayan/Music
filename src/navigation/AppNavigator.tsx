import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LikedSongsScreen from '../screens/LikedSongsScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuthStore } from '../store/useAuthStore';
import { colors } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Player: undefined;
  Profile: undefined;
  LikedSongs: undefined;
  Playlists: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { session } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!session ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom'
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              animation: 'slide_from_right'
            }}
          />
          <Stack.Screen
            name="LikedSongs"
            component={LikedSongsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Playlists"
            component={PlaylistsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

