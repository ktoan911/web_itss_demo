// Read an image file, scale it down to a max edge of `maxSize`, and compress to JPEG.
// Returns a base64 data URL small enough to send as JSON to the server (which then uploads to imgbb).
export async function fileToCompressedDataUrl(
  file: File,
  maxSize = 1920,
  quality = 0.82,
): Promise<string> {
  const source = await decodeImage(file);

  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(source, 0, 0, width, height);
  if ('close' in source) source.close(); // release the ImageBitmap
  return canvas.toDataURL('image/jpeg', quality);
}

// Decode the image straight from the Blob via createImageBitmap (no base64, off-main-thread).
// Older browsers don't support it → fall back to FileReader → <img>.
async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // some formats/browsers can't decode → fall through to the fallback
    }
  }
  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
