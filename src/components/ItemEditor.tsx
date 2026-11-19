"use client";

import { useState } from "react";
import { actions } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABEL, FORMALITY, SEASONS, type Item } from "@/lib/types";
import { Button, Chip, Label, Sheet, inputClass } from "./ui";

export function ItemEditor({ item, onClose }: { item: Item | null; onClose: () => void }) {
  return (
    <Sheet open={!!item} onClose={onClose} title="Item">
      {item && <Form key={item.id} item={item} onClose={onClose} />}
    </Sheet>
  );
}

function Form({ item, onClose }: { item: Item; onClose: () => void }) {
  const [d, setD] = useState(item);
  const [colors, setColors] = useState(item.colors.join(", "));
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = () => {
    actions.updateItem(item.id, {
      ...d,
      colors: colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt="" className="size-28 shrink-0 rounded-2xl border border-line bg-white object-contain" />
        <div className="min-w-0 flex-1 space-y-2">
          <input className={`${inputClass} font-serif text-lg`} value={d.name} onChange={(e) => set("name", e.target.value)} aria-label="Name" />
          <p className="text-sm text-muted">
            Worn {item.timesWorn} time{item.timesWorn === 1 ? "" : "s"}
            {item.lastWorn ? `, last on ${new Date(item.lastWorn + "T12:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <select className={inputClass} value={d.category} onChange={(e) => set("category", e.target.value as Item["category"])}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Type</Label>
          <input className={inputClass} value={d.subcategory} onChange={(e) => set("subcategory", e.target.value)} />
        </div>
        <div>
          <Label>Colours</Label>
          <input className={inputClass} value={colors} onChange={(e) => setColors(e.target.value)} />
        </div>
        <div>
          <Label>Material</Label>
          <input className={inputClass} value={d.material} onChange={(e) => set("material", e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Warmth · {["", "very light", "light", "mid-weight", "warm", "heavy"][d.warmth]}</Label>
        <input
          type="range"
          min={1}
          max={5}
          value={d.warmth}
          onChange={(e) => set("warmth", Number(e.target.value))}
          className="w-full accent-clay"
        />
      </div>

      <div>
        <Label>Dress code</Label>
        <div className="flex flex-wrap gap-2">
          {FORMALITY.map((f) => (
            <Chip key={f} active={d.formality === f} onClick={() => set("formality", f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label>Seasons</Label>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <Chip
              key={s}
              active={d.seasons.includes(s)}
              onClick={() => set("seasons", d.seasons.includes(s) ? d.seasons.filter((x) => x !== s) : [...d.seasons, s])}
            >
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
        <span className="text-[15px]">Rain-proof</span>
        <input type="checkbox" checked={d.waterproof} onChange={(e) => set("waterproof", e.target.checked)} className="size-5 accent-clay" />
      </label>

      <div>
        <Label>Notes for the stylist</Label>
        <input
          className={inputClass}
          placeholder="e.g. runs small, only for the office, favourite"
          value={d.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
        {confirm ? (
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              actions.removeItem(item.id);
              onClose();
            }}
          >
            Tap again to delete
          </Button>
        ) : (
          <Button variant="ghost" className="flex-1 text-clay" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        )}
        <Button className="flex-[2]" onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
