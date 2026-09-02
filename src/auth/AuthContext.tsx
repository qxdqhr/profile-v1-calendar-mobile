import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { CalendarApiClient } from '@profile/calendar-shared';

import {
  LOGIN_WEB_URL,
  createCalendarClient,
  fetchSession,
  signOut,
  type AuthUser,
} from '../config';
import {
  clearAuthCookies,
  readStoredCookieHeader,
  syncNativeCookieHeader,
  writeStoredCookieHeader,
} from './cookieStore';

type RefreshSessionOptions = {
  preserveCookiesOnEmptySession?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  cookieHeader: string | null;
  calendarApi: CalendarApiClient;
  refreshSession: (options?: RefreshSessionOptions) => Promise<AuthUser | null>;
  completeLoginIfReady: () => Promise<boolean>;
  setCookieHeader: (cookie: string | null) => Promise<void>;
  logout: () => Promise<void>;
  loginUrl: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cookieHeader, setCookieHeaderState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const unauthorizedHandled = useRef(false);

  const setCookieHeader = useCallback(async (cookie: string | null) => {
    setCookieHeaderState(cookie);
    await writeStoredCookieHeader(cookie);
  }, []);

  const logout = useCallback(async () => {
    await signOut(cookieHeader);
    await clearAuthCookies();
    setCookieHeaderState(null);
    setUser(null);
  }, [cookieHeader]);

  const handleUnauthorized = useCallback(() => {
    if (unauthorizedHandled.current) return;
    unauthorizedHandled.current = true;
    void (async () => {
      await clearAuthCookies();
      setCookieHeaderState(null);
      setUser(null);
      unauthorizedHandled.current = false;
    })();
  }, []);

  const refreshSession = useCallback(
    async (options?: RefreshSessionOptions): Promise<AuthUser | null> => {
      const synced = await syncNativeCookieHeader();
      const header = synced ?? cookieHeader;
      if (synced && synced !== cookieHeader) {
        setCookieHeaderState(synced);
      }

      const sessionUser = await fetchSession(header);
      setUser(sessionUser);

      if (header && !sessionUser && !options?.preserveCookiesOnEmptySession) {
        await clearAuthCookies();
        setCookieHeaderState(null);
      }

      return sessionUser;
    },
    [cookieHeader],
  );

  const completeLoginIfReady = useCallback(async (): Promise<boolean> => {
    const sessionUser = await refreshSession({ preserveCookiesOnEmptySession: true });
    return Boolean(sessionUser);
  }, [refreshSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const stored = await readStoredCookieHeader();
        if (cancelled) return;

        const synced = await syncNativeCookieHeader();
        const header = synced ?? stored;
        if (header) setCookieHeaderState(header);

        const sessionUser = await fetchSession(header);
        if (cancelled) return;

        if (header && !sessionUser) {
          await clearAuthCookies();
          setCookieHeaderState(null);
        }

        setUser(sessionUser);
      } catch (error) {
        console.warn('[Auth] bootstrap failed', error);
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshSession();
    });
    return () => sub.remove();
  }, [refreshSession]);

  const calendarApi = useMemo(
    () => createCalendarClient(cookieHeader, handleUnauthorized),
    [cookieHeader, handleUnauthorized],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      cookieHeader,
      calendarApi,
      refreshSession,
      completeLoginIfReady,
      setCookieHeader,
      logout,
      loginUrl: LOGIN_WEB_URL,
    }),
    [
      user,
      isLoading,
      cookieHeader,
      calendarApi,
      refreshSession,
      completeLoginIfReady,
      setCookieHeader,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
