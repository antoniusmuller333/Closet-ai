"use client";

import { useEffect, useRef, useState } from "react";
import { actions, api } from "@/lib/store";
import { loadBitmap, toDataURL } from "@/lib/image";
import type { AnalyzedItem, Item } from "@/lib/types";
import { Button, Sheet, Spinner } from "./ui";
import { CheckIcon } from "./icons";

type Found = { key: string; image: string; data: AnalyzedItem; keep: boolean };

export function ScanSheet({ files, onClose }: { files: File[] | null; onClose: () => void }) {
  const [found, setFound] = useState<Found[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const run = useRef(0);

  useEffect(() => {
    if (!files?.length) return;
    const id = ++run.current;
    setFound([]);
    setErrors([]);
    setBusy(true);
    setProgress({ done: 0, total: files.length });

    (async () => {
      for (const [n, file] of files.entries()) {
        if (run.current !== id) return;
        try {
          const bmp = await loadBitmap(file);
          const image = toDataURL(bmp, 1024, undefined, 0.8);
          const { items } = await api<{ items: AnalyzedItem[] }>("/api/analyze", { image });
          if (run.current !== id) return;
          if (!items.length) setErrors((e) => [...e, `Photo ${n + 1}: no clothes spotted.`]);
          // Crop now: the state updater runs later, after the bitmap is released
          const crops: Found[] = items.map((data, i) => ({
            key: `${n}-${i}`,
            image: toDataURL(bmp, 520, data.box),
            data,
            keep: true,
          }));
          bmp.close();
          setFound((f) => [...f, ...crops]);
        } catch (e) {
          setErrors((errs) => [...errs, `Photo ${n + 1}: ${e instanceof Error ? e.message : "failed"}`]);
        }
        setProgress({ done: n + 1, total: files.length });
      }
      if (run.current === id) setBusy(false);
    })();
  }, [files]);

  const close = () => {
    run.current++;
    setBusy(false);
    onClose();
  };

  const keep = found.filter((f) => f.keep);

  const save = () => {
    const now = Date.now();
    const items: Item[] = keep.map((f, i) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { box, ...attrs } = f.data;
      return { ...attrs, id: crypto.randomUUID(), image: f.image, createdAt: now - i, timesWorn: 0 };
    });
    actions.addItems(items);
    close();
  };

  return (
    <Sheet open={!!files} onClose={close} title={busy ? "Scanning…" : found.length ? `Found ${found.length} item${found.length === 1 ? "" : "s"}` : "Scan"}>
      {busy && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-linen px-4 py-3 text-sm">
          <Spinner />
          <span>
            Reading photo {Math.min(progress.done + 1, progress.total)} of {progress.total}. Takes a few seconds each.
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mb-4 space-y-1 rounded-2xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay-dark">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {found.length > 0 && <p className="mb-3 text-sm text-muted">Tap to leave anything out. You can fix details later in your closet.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {found.map((f) => (
          <button
            key={f.key}
            onClick={() => setFound((all) => all.map((x) => (x.key === f.key ? { ...x, keep: !x.keep } : x)))}
            className={`animate-rise relative overflow-hidden rounded-2xl border text-left transition ${
              f.keep ? "border-ink/70" : "border-line opacity-45"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.image} alt={f.data.name} className="aspect-square w-full bg-white object-contain" />
            <div className="border-t border-line bg-paper px-2.5 py-2">
              <div className="truncate text-[13px] font-medium">{f.data.name}</div>
              <div className="truncate text-xs text-muted">
                {f.data.colors.slice(0, 2).join(", ")} · warmth {f.data.warmth}/5
              </div>
            </div>
            <span
              className={`absolute top-2 right-2 grid size-6 place-items-center rounded-full border ${
                f.keep ? "border-ink bg-ink text-paper" : "border-line bg-paper"
              }`}
            >
              {f.keep && <CheckIcon className="size-3.5" />}
            </span>
          </button>
        ))}
        {busy &&
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="shimmer aspect-[4/5] rounded-2xl" />)}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-5 flex gap-3 border-t border-line bg-paper px-5 pt-4">
        <Button variant="ghost" onClick={close} className="flex-1">
          Cancel
        </Button>
        <Button onClick={save} disabled={!keep.length} className="flex-[2]">
          {busy ? "Add what's ready" : `Add ${keep.length} to closet`}
        </Button>
      </div>
    </Sheet>
  );
}
