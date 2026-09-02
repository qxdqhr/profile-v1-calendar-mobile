import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation';
import { LOGIN_WEB_URL } from '../config';
import { Title } from '../ui';
import { ai } from '../ui/tokens';
import { calDesc, calScreen, calTopbar } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const OPEN_LOGIN_SCRIPT = `
(function () {
  function label(el) {
    return (el.textContent || el.innerText || '').replace(/\\s+/g, ' ').trim();
  }
  var buttons = Array.prototype.slice.call(document.querySelectorAll('button'));
  var loginBtn = buttons.find(function (btn) {
    var text = label(btn);
    return text === '登录' || text.indexOf('登录') >= 0;
  });
  if (loginBtn) loginBtn.click();
})();
true;
`;

export function LoginScreen(_props: Props) {
  const { completeLoginIfReady, user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);
  const loggedInRef = useRef(false);
  const navDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tryCompleteLogin = useCallback(async () => {
    if (loggedInRef.current || syncingRef.current || user) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const ok = await completeLoginIfReady();
      if (ok) loggedInRef.current = true;
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [completeLoginIfReady, user]);

  useEffect(() => {
    if (user) loggedInRef.current = true;
  }, [user]);

  useEffect(() => {
    if (loggedInRef.current || user) return undefined;
    const timer = setInterval(() => {
      void tryCompleteLogin();
    }, 2500);
    return () => clearInterval(timer);
  }, [tryCompleteLogin, user]);

  const scheduleNavCheck = useCallback(() => {
    if (loggedInRef.current || user) return;
    if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    navDebounceRef.current = setTimeout(() => {
      void tryCompleteLogin();
    }, 800);
  }, [tryCompleteLogin, user]);

  useEffect(
    () => () => {
      if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    },
    [],
  );

  const handleNavigationChange = (_event: WebViewNavigation) => {
    scheduleNavCheck();
  };

  return (
    <View className={calScreen}>
      <View className={calTopbar}>
        <Title color="app-teal" size="small">
          日历
        </Title>
        <Text className={`mt-2 ${calDesc}`}>在下方页面登录，会话同步后自动进入应用</Text>
      </View>

      <View className="relative flex-1">
        <WebView
          source={{ uri: LOGIN_WEB_URL }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          setSupportMultipleWindows={false}
          originWhitelist={['http://*', 'https://*']}
          onNavigationStateChange={handleNavigationChange}
          onLoadEnd={() => {
            scheduleNavCheck();
          }}
          injectedJavaScript={OPEN_LOGIN_SCRIPT}
          className="flex-1 bg-[#f8f8f0]"
        />

        {isSyncing ? (
          <View className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-2 shadow-sm">
            <ActivityIndicator size="small" color={ai.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
