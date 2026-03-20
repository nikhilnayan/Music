import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import LoginScreen from '../screens/LoginScreen';
import { colors } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Player: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen 
        name="Player" 
        component={PlayerScreen} 
        options={{ 
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom' 
        }}
      />
    </Stack.Navigator>
  );
};
