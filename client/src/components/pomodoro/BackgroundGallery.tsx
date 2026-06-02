import { type ReactNode, useRef, useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Pin,
  Repeat,
  Shuffle,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettings } from '@/hooks/queries/useSettingsQueries';
import { useBackgrounds } from '@/hooks/useBackgrounds';
import { settingsApi } from '@/api/settingsApi';
import { fileToCompressedDataUrl } from '@/lib/image';
import { getApiErrorMessage } from '@/utils/apiError';
import { Modal } from '@/components/common/Modal';
import type { BackgroundMode, SettingsUpdateInput } from '@/types/settings';

const MODE_OPTIONS: { value: BackgroundMode; label: string; desc: string; icon: ReactNode }[] = [
  {
    value: 'unchange',
    label: 'Fixed',
    desc: 'Tap an image to use it as a fixed background.',
    icon: <Pin className="h-4 w-4" />,
  },
  {
    value: 'random',
    label: 'Random',
    desc: 'A random image from the library every minute.',
    icon: <Shuffle className="h-4 w-4" />,
  },
  {
    value: 'sequence',
    label: 'Sequence',
    desc: 'Cycles through the library in order every minute.',
    icon: <Repeat className="h-4 w-4" />,
  },
];

export function BackgroundGallery() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const update = useUpdateSettings();
  const { all, uploaded, mode, selected } = useBackgrounds();

  const setMode = (m: BackgroundMode) => {
    const patch: SettingsUpdateInput = { backgroundMode: m };
    if (m === 'unchange' && !selected && all.length) patch.backgroundSelected = all[0];
    update.mutate(patch);
  };

  const pick = (url: string) =>
    update.mutate({ backgroundMode: 'unchange', backgroundSelected: url });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!images.length) {
      toast.error('No valid images');
      return;
    }
    setUploading(true);
    try {
      // Independent images → compress + upload concurrently instead of sequentially.
      const urls = await Promise.all(
        images.map(
          async (f) => (await settingsApi.uploadBackground(await fileToCompressedDataUrl(f))).url,
        ),
      );
      update.mutate(
        { backgroundUrls: [...uploaded, ...urls] },
        { onSuccess: () => toast.success(`Uploaded ${urls.length} image(s)`) },
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeUploaded = (url: string) => {
    const patch: SettingsUpdateInput = { backgroundUrls: uploaded.filter((u) => u !== url) };
    if (selected === url) patch.backgroundSelected = '';
    update.mutate(patch);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Change background"
        title="Change background"
        className="rounded-full bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/50"
      >
        <ImageIcon className="h-5 w-5" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Background library"
        size="xl"
        panelClassName="border border-white/10 bg-neutral-900/95 text-white shadow-2xl"
        closeClassName="text-white/70 hover:bg-white/10 hover:text-white"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {MODE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setMode(o.value)}
              title={o.desc}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                mode === o.value
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 text-white/85 hover:bg-white/20'
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>

        <p className="mb-3 text-xs text-white/60">
          {MODE_OPTIONS.find((o) => o.value === mode)?.desc}
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />

        <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/25 text-white/70 transition hover:border-white/50 hover:text-white disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Uploading…</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload image</span>
              </>
            )}
          </button>

          {all.map((url) => {
            const isUploaded = uploaded.includes(url);
            const isSelected = mode === 'unchange' && selected === url;
            return (
              <div key={url} className="group relative aspect-video overflow-hidden rounded-2xl">
                <button
                  onClick={() => pick(url)}
                  className="h-full w-full"
                  title={
                    mode === 'unchange'
                      ? 'Use this image'
                      : 'Use this image (switches to Fixed mode)'
                  }
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <span
                    className={`absolute inset-0 transition ${
                      isSelected ? 'ring-4 ring-inset ring-white' : 'group-hover:bg-black/20'
                    }`}
                  />
                  {isSelected && (
                    <span className="absolute right-2 top-2 rounded-full bg-white p-1 text-neutral-900">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
                {isUploaded && (
                  <button
                    onClick={() => removeUploaded(url)}
                    aria-label="Delete image"
                    title="Delete image"
                    className="absolute left-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
