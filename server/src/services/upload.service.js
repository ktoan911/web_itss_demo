import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';

export const uploadService = {
  // Accepts base64 image data (with or without the data URI prefix), uploads to imgbb, returns the display URL.
  async uploadImage(base64) {
    if (!env.IMGBB_API_KEY) {
      throw new AppError('Image upload is not configured on the server', 503);
    }
    if (typeof base64 !== 'string' || base64.length === 0) {
      throw new AppError('Missing image data', 400);
    }

    // imgbb only accepts the raw base64 payload, so strip the "data:image/png;base64," prefix.
    // With no comma, indexOf returns -1 → slice(0) keeps the whole string.
    const payload = base64.slice(base64.indexOf(',') + 1);

    const form = new FormData();
    form.append('key', env.IMGBB_API_KEY);
    form.append('image', payload);

    let res;
    try {
      res = await fetch(IMGBB_ENDPOINT, { method: 'POST', body: form });
    } catch {
      throw new AppError('Failed to reach image host', 502);
    }

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success || !json?.data?.url) {
      const message = json?.error?.message ?? 'Image upload failed';
      throw new AppError(message, 502);
    }

    return { url: json.data.url, deleteUrl: json.data.delete_url ?? null };
  },
};
