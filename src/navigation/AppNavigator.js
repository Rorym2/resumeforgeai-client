import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';

import { supabase } from '../lib/supabase';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import JobInputScreen from '../screens/JobInputScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PaywallScreen from '../screens/PaywallScreen';

import { colors, font, spacing } from '../theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [session, setSession] = useState(undefined); // undefined = still loading

  // Listen for login/logout events from Supabase
  useEffect(() => {
    // Get existing session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Still checking for an existing session — show nothing briefly
  if (session === undefined) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {session ? (
          // Logged in — show the main app screens
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'ResumeForge AI',
                headerRight: () => (
                  <TouchableOpacity onPress={() => navigation.navigate('History')} style={{ marginRight: spacing.sm }}>
                    <Text style={{ color: colors.primary, fontSize: font.md, fontWeight: '600' }}>History</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="JobInput"
              component={JobInputScreen}
              options={{ title: 'Job Description' }}
            />
            <Stack.Screen
              name="Processing"
              component={ProcessingScreen}
              options={{ title: 'Generating...', headerBackVisible: false }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: 'Your Results' }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: 'My Documents' }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{
                title: 'Go Pro',
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          // Logged out — show the auth screen
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
