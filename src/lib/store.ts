"use client";

import { get, set, del } from "idb-keyval";
import { useSyncExternalStore } from "react";
import type { Item, Settings, WearLog } from "./types";

type State = { items: Item[]; log: WearLog[]; settings: Settings; ready: boolean };

const initial: State = { items: [], log: [], settings: { unit: "C" }, ready: false };
let state: State = initial;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function commit(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
  if (patch.items) set("items", state.items);
  if (patch.log) set("log", state.log);
  if (patch.settings) set("settings", state.settings);
}

export async function loadStore() {
  if (state.ready) return;
  const [items, log, settings] = await Promise.all([get("items"), get("log"), get("settings")]);
  state = {
    items: items ?? [],
    log: log ?? [],
    settings: { unit: "C", ...(settings ?? {}) },
    ready: true,
  };
  listeners.forEach((l) => l());
  // Ask the browser not to evict our data
  navigator.storage?.persist?.().catch(() => {});
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}

export function getState() {
  return state;
}

export const actions = {
  addItems(items: Item[]) {
    commit({ items: [...items, ...state.items] });
  },
  updateItem(id: string, patch: Partial<Item>) {
    commit({ items: state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  },
  removeItem(id: string) {
    commit({
      items: state.items.filter((i) => i.id !== id),
      log: state.log.map((l) => ({ ...l, itemIds: l.itemIds.filter((x) => x !== id) })),
    });
  },
  /** One outfit per day: logging again for the same date replaces the earlier entry. */
  logWear(entry: Omit<WearLog, "id">) {
    const previous = state.log.find((l) => l.date === entry.date);
    const counts = new Map<string, number>();
    previous?.itemIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) - 1));
    entry.itemIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    const items = state.items.map((i) => {
      const delta = counts.get(i.id);
      if (!delta) return i;
      const wornNow = entry.itemIds.includes(i.id);
      return {
        ...i,
        timesWorn: Math.max(0, i.timesWorn + delta),
        lastWorn: wornNow && (!i.lastWorn || entry.date >= i.lastWorn) ? entry.date : i.lastWorn,
      };
    });
    const log = [{ ...entry, id: crypto.randomUUID() }, ...state.log.filter((l) => l.date !== entry.date)].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    commit({ items, log });
  },
  removeLog(id: string) {
    const entry = state.log.find((l) => l.id === id);
    if (!entry) return;
    const items = state.items.map((i) =>
      entry.itemIds.includes(i.id) ? { ...i, timesWorn: Math.max(0, i.timesWorn - 1) } : i,
    );
    commit({ items, log: state.log.filter((l) => l.id !== id) });
  },
  setSettings(patch: Partial<Settings>) {
    commit({ settings: { ...state.settings, ...patch } });
  },
  importAll(data: { items?: Item[]; log?: WearLog[]; settings?: Settings }) {
    commit({
      items: data.items ?? [],
      log: data.log ?? [],
      settings: { unit: "C", ...(data.settings ?? {}) },
    });
  },
  async wipe() {
    await Promise.all([del("items"), del("log"), del("settings")]);
    state = { ...initial, ready: true };
    listeners.forEach((l) => l());
  },
};

export function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-passcode": state.settings.passcode ?? "" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}
