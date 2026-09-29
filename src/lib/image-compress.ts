/**
 * Shrinks a photo in the browser to a JPEG under `maxBytes` (longest side ≤ `maxSide`), so receipts
 * upload quickly on mobile data and stay small in storage.
 */
export async function compressImage(file: File, maxBytes = 500 * 1024, maxSide = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  let quality = 0.8;
  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= maxBytes) return blob;
    if (quality > 0.5) quality -= 0.15;
    else scale *= 0.75;
  }
  throw new Error("Couldn't shrink this photo enough");
}
