// Đọc file ảnh, thu nhỏ về cạnh dài tối đa `maxSize` và nén JPEG.
// Trả về data URL base64 đủ nhỏ để gửi qua JSON lên server (rồi server đẩy lên imgbb).
export async function fileToCompressedDataUrl(
  file: File,
  maxSize = 1920,
  quality = 0.82,
): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
