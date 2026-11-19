"use client";

import { useState } from "react";
import { actions } from "@/lib/store";
import { getPosition, placeName, searchPlaces } from "@/lib/weather";
import type { Place } from "@/lib/types";
import { Button, Sheet, Spinner, inputClass } from "./ui";
import { PinIcon } from "./icons";

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState<"gps" | "search" | null>(null);
  const [error, setError] = useState("");

  const choose = (p: Place) => {
    actions.setSettings({ location: p });
    setQ("");
    setResults([]);
    onClose();
  };

  const useGps = async () => {
    setBusy("gps");
    setError("");
    try {
      const { lat, lon } = await getPosition();
      choose({ lat, lon, name: await placeName(lat, lon) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't get your location");
    } finally {
      setBusy(null);
    }
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy("search");
    setError("");
    try {
      const r = await searchPlaces(q.trim());
      setResults(r);
      if (!r.length) setError("No places found.");
    } catch {
      setError("Search failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Where are you?">
      <Button onClick={useGps} disabled={!!busy} className="w-full">
        {busy === "gps" ? <Spinner /> : <PinIcon />} Use my current location
      </Button>
      <div className="my-4 text-center text-xs tracking-wide text-muted uppercase">or search a city</div>
      <form onSubmit={search} className="flex gap-2">
        <input className={inputClass} placeholder="London, Luxembourg, Zürich…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" variant="outline" disabled={!!busy} className="px-4">
          {busy === "search" ? <Spinner /> : "Search"}
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-clay">{error}</p>}
      <ul className="mt-3 divide-y divide-line">
        {results.map((p) => (
          <li key={`${p.lat},${p.lon}`}>
            <button onClick={() => choose(p)} className="w-full px-1 py-3 text-left text-[15px] hover:text-clay">
              {p.name}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
