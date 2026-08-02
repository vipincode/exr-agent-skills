"use client";

import { useSyncExternalStore } from "react";

export type SessionUser = { id: string; email: string; name: string; role: string };
export type Session = { user: SessionUser; token: string };

const STORAGE_KEY = "auth.session";
const listeners = new Set<() => void>();

let session: Session | null = null;
let hydrated = false;

function readStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Session | null {
  if (!hydrated) {
    session = readStoredSession();
    hydrated = true;
  }
  return session;
}

function getServerSnapshot(): Session | null {
  return null;
}

/** Store the session after a successful register/login. */
export function setSession(next: Session) {
  session = next;
  hydrated = true;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

/** Clear the session on logout (slice 03). */
export function clearSession() {
  session = null;
  hydrated = true;
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

/** Current user/role accessor, plus the session writers the auth slices need. */
export function useAuth() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    user: current?.user ?? null,
    token: current?.token ?? null,
    isAuthenticated: current !== null,
    setSession,
    clearSession,
  };
}
