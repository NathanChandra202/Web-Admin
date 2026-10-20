const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'jwt_user';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  avatarUrl?: string | null;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // 1. Try localStorage
  const fromLs = localStorage.getItem(TOKEN_KEY);
  if (fromLs) return fromLs;

  // 2. Fallback to Cookie and restore to localStorage
  const fromCookie = getCookie(TOKEN_KEY);
  if (fromCookie) {
    try {
      localStorage.setItem(TOKEN_KEY, fromCookie);
    } catch (_) {}
    return fromCookie;
  }

  return null;
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (_) {}
  setCookie(TOKEN_KEY, token, 30);
}

export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  // 1. Try localStorage
  const rawLs = localStorage.getItem(USER_KEY);
  if (rawLs) {
    try {
      return JSON.parse(rawLs);
    } catch (_) {}
  }

  // 2. Fallback to Cookie and restore to localStorage
  const rawCookie = getCookie(USER_KEY);
  if (rawCookie) {
    try {
      const parsed = JSON.parse(rawCookie);
      localStorage.setItem(USER_KEY, JSON.stringify(parsed));
      return parsed;
    } catch (_) {}
  }

  return null;
}

export function setUser(user: StoredUser): void {
  if (typeof window === 'undefined') return;
  const str = JSON.stringify(user);
  try {
    localStorage.setItem(USER_KEY, str);
  } catch (_) {}
  setCookie(USER_KEY, str, 30);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (_) {}
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'ADMIN';
}
