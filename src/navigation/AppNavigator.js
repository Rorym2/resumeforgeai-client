import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';

import { supabase } from '../lib/supabase';
import { initPurchases, identifyUser, resetUser } from '../lib/purchases';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import JobInputScreen from '../screens/JobInputScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PaywallScreen from '../screens/PaywallScreen';
import DoneScreen from '../screens/DoneScreen';

import { colors, font, spacing } from '../theme';

const Stack = createNativeStackNavigator();

// Dark abyss header shared across all authenticated screens
const HEADER_DARK = '#0F172A';

export default function AppNavigator() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    initPurchases().catch(e => console.error('[Purchases] init error:', e));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) identifyUser(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        identifyUser(session.user.id);
      } else {
        resetUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: HEADER_DARK },
          headerTintColor: '#F8FAFF',
          headerTitleStyle: { fontWeight: '600', fontSize: font.md },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {session ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'ResumeForge AI',
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('History')}
                    style={{ marginRight: spacing.sm }}
                  >
                    <Text style={{ color: colors.accent, fontSize: font.sm, fontWeight: '600', letterSpacing: 0.3 }}>
                      History
                    </Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen name="JobInput" component={JobInputScreen} options={{ title: 'Job Description' }} />
            <Stack.Screen
              name="Processing"
              component={ProcessingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Your Results' }} />
            <Stack.Screen name="Done" component={DoneScreen} options={{ title: 'Export Documents' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'My Documents' }} />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ title: 'Go Pro', presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
