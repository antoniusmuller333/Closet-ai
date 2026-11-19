"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABEL, type Category, type Item } from "@/lib/types";
import { Chip } from "./ui";
import { CameraIcon } from "./icons";
import { ScanSheet } from "./ScanSheet";
import { ItemEditor } from "./ItemEditor";

export function ClosetView() {
  const { items } = useStore();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [files, setFiles] = useState<File[] | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => {
    const c = new Map<Category, number>();
    items.forEach((i) => c.set(i.category, (c.get(i.category) ?? 0) + 1));
    return c;
  }, [items]);

  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <section>
      <header className="flex items-end justify-between gap-4 pt-8 pb-5">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Closet</h1>
          <p className="mt-1 text-sm text-muted">
            {items.length ? `${items.length} piece${items.length === 1 ? "" : "s"}` : "Nothing here yet"}
          </p>
        </div>
        <button
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink/85"
        >
          <CameraIcon />
          Scan clothes
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            if (list.length) setFiles(list.slice(0, 10));
            e.target.value = "";
          }}
        />
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-paper/60 px-6 py-10 text-center">
          <p className="font-serif text-2xl">Photograph your clothes</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted">
            One piece per photo gives the cleanest result, but a flat lay or an open rail works too: each item gets picked out and
            tagged for colour, warmth and dress code.
          </p>
          <button
            onClick={() => input.current?.click()}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-clay px-5 py-3 font-medium text-paper hover:bg-clay-dark"
          >
            <CameraIcon />
            Take or choose photos
          </button>
        </div>
      ) : (
        <>
          <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </Chip>
            {CATEGORIES.filter((c) => counts.get(c)).map((c) => (
              <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
                {CATEGORY_LABEL[c]} <span className="opacity-60">{counts.get(c)}</span>
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {shown.map((i) => (
              <button key={i.id} onClick={() => setEditing(i)} className="group text-left">
                <div className="overflow-hidden rounded-2xl border border-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image} alt={i.name} loading="lazy" className="aspect-square w-full object-contain transition group-hover:scale-[1.03]" />
                </div>
                <div className="mt-1.5 line-clamp-2 px-0.5 text-[12.5px] leading-snug">{i.name}</div>
              </button>
            ))}
          </div>
        </>
      )}

      <ScanSheet files={files} onClose={() => setFiles(null)} />
      <ItemEditor item={editing} onClose={() => setEditing(null)} />
    </section>
  );
}
