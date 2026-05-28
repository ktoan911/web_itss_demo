import { useEffect, useRef, useState } from 'react';
import { ListMusic, Pause, Play, Volume2, Waves, X } from 'lucide-react';
import { useSoundStore, type SoundTrack } from '@/store/soundStore';

type Channel = 'ambient' | 'music';

export function SoundControls() {
  const loadManifest = useSoundStore((s) => s.loadManifest);
  const manifest = useSoundStore((s) => s.manifest);

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  if (manifest.ambient.length === 0 && manifest.music.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3">
      {manifest.ambient.length > 0 && (
        <ChannelButton
          channel="ambient"
          icon={<Waves className="h-5 w-5" />}
          title="Âm thanh nền"
        />
      )}
      {manifest.music.length > 0 && (
        <ChannelButton
          channel="music"
          icon={<ListMusic className="h-5 w-5" />}
          title="Nhạc tập trung"
        />
      )}
    </div>
  );
}

function ChannelButton({
  channel,
  icon,
  title,
}: {
  channel: Channel;
  icon: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tracks = useSoundStore((s) =>
    channel === 'ambient' ? s.manifest.ambient : s.manifest.music,
  );
  const current = useSoundStore((s) => (channel === 'ambient' ? s.ambientTrack : s.musicTrack));
  const volume = useSoundStore((s) => (channel === 'ambient' ? s.ambientVolume : s.musicVolume));
  const setTrack = useSoundStore((s) => s.setTrack);
  const setVolume = useSoundStore((s) => s.setVolume);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const playing = !!current;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={title}
        className={`rounded-full p-3 backdrop-blur transition ${
          playing
            ? 'bg-white/25 text-white shadow-md'
            : 'bg-black/30 text-white/85 hover:bg-black/50'
        }`}
      >
        {icon}
      </button>

      {open && (
        <div className="absolute bottom-14 right-0 z-20 w-72 rounded-2xl border border-white/10 bg-black/75 p-3 text-white shadow-xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{title}</span>
            <button
              aria-label="Đóng"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="mb-3 max-h-56 overflow-auto">
            {tracks.map((t) => (
              <TrackRow
                key={t.file}
                track={t}
                active={current === t.file}
                onSelect={() => setTrack(channel, current === t.file ? null : t.file)}
              />
            ))}
          </ul>

          <div className="flex items-center gap-2 border-t border-white/10 pt-3">
            <Volume2 className="h-4 w-4 text-white/70" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(channel, Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-white"
              aria-label="Âm lượng"
            />
            <span className="w-8 text-right text-xs tabular-nums text-white/70">
              {Math.round(volume * 100)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackRow({
  track,
  active,
  onSelect,
}: {
  track: SoundTrack;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition ${
          active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'
        }`}
      >
        {active ? <Pause className="h-4 w-4 shrink-0" /> : <Play className="h-4 w-4 shrink-0" />}
        <span className="truncate">{track.label}</span>
      </button>
    </li>
  );
}
