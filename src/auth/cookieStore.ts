import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { AUTH_BASE_URL, CALENDAR_API_BASE_URL, CALENDAR_WEB_BASE_URL } from '../config';

export const AUTH_COOKIE_STORAGE_KEY = 'calendar_auth_cookie';

type CookieRecord = {
  name: string;
  value: string;
};

type CookieManagerModule = {
  get: (url: string, useWebKit?: boolean) => Promise<Record<string, CookieRecord>>;
  clearAll: (useWebKit?: boolean) => Promise<boolean>;
};

function loadCookieManager(): CookieManagerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-cookies/cookies').default as CookieManagerModule;
  } catch {
    return null;
  }
}

function serializeCookieJar(jar: Record<string, CookieRecord>): string {
  return Object.values(jar)
    .filter((item) => item?.name && item?.value)
    .map((item) => `${item.name}=${item.value}`)
    .join('; ');
}

async function readJarForUrl(
  manager: CookieManagerModule,
  url: string,
): Promise<Record<string, CookieRecord>> {
  try {
    const useWebKit = Platform.OS === 'ios';
    return await manager.get(url, useWebKit);
  } catch {
    return {};
  }
}

export async function readStoredCookieHeader(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(AUTH_COOKIE_STORAGE_KEY);
  return stored?.trim() || null;
}

export async function writeStoredCookieHeader(cookieHeader: string | null): Promise<void> {
  if (cookieHeader?.trim()) {
    await AsyncStorage.setItem(AUTH_COOKIE_STORAGE_KEY, cookieHeader.trim());
  } else {
    await AsyncStorage.removeItem(AUTH_COOKIE_STORAGE_KEY);
  }
}

export async function syncNativeCookieHeader(): Promise<string | null> {
  const manager = loadCookieManager();
  if (!manager) return readStoredCookieHeader();

  const [authJar, calendarApiJar, calendarWebJar] = await Promise.all([
    readJarForUrl(manager, AUTH_BASE_URL),
    readJarForUrl(manager, CALENDAR_API_BASE_URL),
    readJarForUrl(manager, CALENDAR_WEB_BASE_URL),
  ]);

  const merged = { ...authJar, ...calendarApiJar, ...calendarWebJar };
  const header = serializeCookieJar(merged);
  if (!header) return readStoredCookieHeader();

  await writeStoredCookieHeader(header);
  return header;
}

export async function clearAuthCookies(): Promise<void> {
  await writeStoredCookieHeader(null);
  const manager = loadCookieManager();
  if (!manager) return;
  try {
    await manager.clearAll(Platform.OS === 'ios');
  } catch {
    // ignore
  }
}
