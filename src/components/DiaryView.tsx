"use client";

import { useMemo } from "react";
import { actions, useStore } from "@/lib/store";

export function DiaryView() {
  const { log, items } = useStore();
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const most = useMemo(() => [...items].filter((i) => i.timesWorn > 0).sort((a, b) => b.timesWorn - a.timesWorn).slice(0, 4), [items]);
  const never = items.filter((i) => i.timesWorn === 0).length;

  return (
    <section>
      <header className="pt-8 pb-5">
        <h1 className="font-serif text-4xl tracking-tight">Diary</h1>
        <p className="mt-1 text-sm text-muted">What you wore, so the stylist doesn&apos;t repeat itself.</p>
      </header>

      {items.length > 0 && log.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-paper px-4 py-3">
            <div className="font-serif text-3xl">{log.length}</div>
            <div className="text-sm text-muted">outfits logged</div>
          </div>
          <div className="rounded-2xl border border-line bg-paper px-4 py-3">
            <div className="font-serif text-3xl">{never}</div>
            <div className="text-sm text-muted">pieces not worn yet</div>
          </div>
          {most.length > 0 && (
            <div className="col-span-2 rounded-2xl border border-line bg-paper px-4 py-3">
              <div className="mb-2 text-sm text-muted">Most worn</div>
              <div className="flex gap-3">
                {most.map((i) => (
                  <div key={i.id} className="w-16 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image} alt={i.name} className="size-16 rounded-xl border border-line bg-white object-contain" />
                    <div className="mt-1 text-xs text-muted">×{i.timesWorn}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {log.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-10 text-center text-[15px] text-muted">
          Nothing logged yet. Pick an outfit on the Today tab and tap &ldquo;Wear this&rdquo;.
        </div>
      ) : (
        <ol className="space-y-3">
          {log.map((l) => {
            const pieces = l.itemIds.map((id) => byId.get(id)).filter(Boolean);
            return (
              <li key={l.id} className="rounded-2xl border border-line bg-paper px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted">
                      {new Date(l.date + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      {l.weather ? ` · ${l.weather}` : ""}
                    </div>
                    <div className="font-serif text-lg">{l.title}</div>
                  </div>
                  <button onClick={() => actions.removeLog(l.id)} className="text-xs text-muted hover:text-clay">
                    Remove
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  {pieces.map((i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i!.id} src={i!.image} alt={i!.name} title={i!.name} className="size-12 rounded-lg border border-line bg-white object-contain" />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
