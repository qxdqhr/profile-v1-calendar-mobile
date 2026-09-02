import Constants from 'expo-constants';

import { CalendarApiClient } from '@profile/calendar-shared';

function readEnv(name: string, extraKey: string, fallback: string): string {
  const fromEnv = process.env[name]?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const fromExtra = Constants.expoConfig?.extra?.[extraKey];
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.trim().replace(/\/+$/, '');
  }

  return fallback.replace(/\/+$/, '');
}

export const AUTH_BASE_URL = readEnv(
  'EXPO_PUBLIC_AUTH_BASE_URL',
  'authBaseUrl',
  'http://localhost:3000',
);
export const CALENDAR_API_BASE_URL = readEnv(
  'EXPO_PUBLIC_CALENDAR_API_BASE_URL',
  'calendarApiBaseUrl',
  'http://localhost:3001',
);

/** Calendar Web 子应用入口（登录 WebView） */
export const CALENDAR_WEB_BASE_URL = readEnv(
  'EXPO_PUBLIC_CALENDAR_WEB_BASE_URL',
  'calendarWebBaseUrl',
  CALENDAR_API_BASE_URL.includes(AUTH_BASE_URL)
    ? CALENDAR_API_BASE_URL
    : `${AUTH_BASE_URL}/calendar`,
);

export const LOGIN_WEB_URL = `${CALENDAR_WEB_BASE_URL.replace(/\/+$/, '')}/`;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type GetSessionResponse = {
  user?: AuthUser | null;
  session?: { id: string } | null;
};

export async function fetchSession(cookieHeader?: string | null): Promise<AuthUser | null> {
  const headers: HeadersInit = {};
  if (cookieHeader) headers.Cookie = cookieHeader;

  const response = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
    headers,
    credentials: cookieHeader ? 'omit' : 'include',
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = (await response.json()) as GetSessionResponse;
  return data.user ?? null;
}

export async function signOut(cookieHeader?: string | null): Promise<void> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers.Cookie = cookieHeader;

  await fetch(`${AUTH_BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
    headers,
    credentials: cookieHeader ? 'omit' : 'include',
  });
}

export function createCalendarClient(
  cookieHeader?: string | null,
  onUnauthorized?: () => void,
): CalendarApiClient {
  return new CalendarApiClient({
    apiBaseUrl: CALENDAR_API_BASE_URL,
    credentials: cookieHeader ? 'omit' : 'include',
    getHeaders: cookieHeader ? () => ({ Cookie: cookieHeader }) : undefined,
    onUnauthorized,
  });
}
