import '@sa2kit-ui/theme-animal-island/theme.mobile.css';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { EventDetailScreen } from './src/screens/EventDetailScreen';
import { EventFormScreen } from './src/screens/EventFormScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import type { RootStackParamList } from './src/navigation';
import { Loading } from './src/ui';
import { calColors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { isLoading, user } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    if (isLoading || !navigationRef.current) return;
    const target = user ? 'Calendar' : 'Login';
    const current = navigationRef.current.getCurrentRoute()?.name;
    if (current === target) return;
    navigationRef.current.reset({ index: 0, routes: [{ name: target }] });
  }, [isLoading, user]);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: calColors.panel },
            headerShadowVisible: false,
            headerTintColor: calColors.text,
            headerTitleStyle: { color: calColors.text, fontWeight: '600' },
            contentStyle: { backgroundColor: calColors.bg },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: '日历' }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: '事件详情' }} />
          <Stack.Screen
            name="EventForm"
            component={EventFormScreen}
            options={({ route }) => ({
              title: route.params.eventId ? '编辑事件' : '新建事件',
            })}
          />
        </Stack.Navigator>

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <Loading fullScreen />
          </View>
        ) : null}
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
