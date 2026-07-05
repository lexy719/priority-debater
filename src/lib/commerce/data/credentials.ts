/**
 * Connector credentials side-channel (Phase 6).
 *
 * `ConnectorStoreRef` bundles (platform, domain, accessToken) — see the contract
 * comment in ../connectors/types.ts: today the CLIENT keeps credentials and posts
 * them to the stateless API routes per request. They live in their OWN localStorage
 * key, never mixed into the entity blob, so that when Supabase persistence lands
 * this file is the only thing that moves server-side (the store_id-keyed lookup
 * shape stays identical).
 *
 * SECURITY NOTE: tokens in localStorage are acceptable only for the current
 * single-user, client-persisted architecture. Server-side storage is the seam.
 */

import type { ConnectorStoreRef } from "../connectors/types";

const KEY = "pd-commerce-credentials";

type CredentialMap = Record<string, ConnectorStoreRef>;

function read(): CredentialMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CredentialMap) : {};
  } catch {
    return {};
  }
}

function write(map: CredentialMap): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* quota — ignore */ }
}

export function getCredentials(storeId: string): ConnectorStoreRef | null {
  return read()[storeId] ?? null;
}

export function setCredentials(storeId: string, ref: ConnectorStoreRef): void {
  const map = read();
  map[storeId] = ref;
  write(map);
}

export function clearCredentials(storeId: string): void {
  const map = read();
  delete map[storeId];
  write(map);
}
