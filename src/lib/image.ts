export type Box = { ymin: number; xmin: number; ymax: number; xmax: number };

export async function loadBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

/**
 * Draw (part of) a bitmap to a JPEG data URL, scaled so the longest side is <= max.
 * `box` is normalised 0–1000 (the format vision models return).
 */
export function toDataURL(bmp: ImageBitmap, max: number, box?: Box, quality = 0.82): string {
  let sx = 0,
    sy = 0,
    sw = bmp.width,
    sh = bmp.height;

  if (box) {
    const b = normaliseBox(box);
    if (b) {
      const padX = (b.xmax - b.xmin) * 0.06;
      const padY = (b.ymax - b.ymin) * 0.06;
      const x0 = Math.max(0, b.xmin - padX) / 1000;
      const y0 = Math.max(0, b.ymin - padY) / 1000;
      const x1 = Math.min(1000, b.xmax + padX) / 1000;
      const y1 = Math.min(1000, b.ymax + padY) / 1000;
      sx = x0 * bmp.width;
      sy = y0 * bmp.height;
      sw = (x1 - x0) * bmp.width;
      sh = (y1 - y0) * bmp.height;
    }
  }

  const scale = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function normaliseBox(box: Box): Box | null {
  const vals = [box.ymin, box.xmin, box.ymax, box.xmax];
  if (vals.some((v) => typeof v !== "number" || Number.isNaN(v))) return null;
  // Some models answer in 0–1 instead of 0–1000
  const k = Math.max(...vals) <= 1.5 ? 1000 : 1;
  const b = {
    ymin: Math.min(box.ymin, box.ymax) * k,
    ymax: Math.max(box.ymin, box.ymax) * k,
    xmin: Math.min(box.xmin, box.xmax) * k,
    xmax: Math.max(box.xmin, box.xmax) * k,
  };
  if (b.xmax - b.xmin < 40 || b.ymax - b.ymin < 40) return null;
  // Box covers basically the whole frame: no need to crop
  if (b.xmax - b.xmin > 960 && b.ymax - b.ymin > 960) return null;
  return b;
}
