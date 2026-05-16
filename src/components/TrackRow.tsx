import { useState, type DragEvent } from 'react';
import { IconPreview } from './IconPreview';
import { validateAnimatedIcon } from '../lib/gifValidate';
import { uploadAnimatedIcon } from '../api/icons';
import { rememberIcon } from '../lib/iconCache';
import type { FlatTrack } from '../lib/mutate';

export interface PendingChange {
  mediaId: string;
  previewUrl: string;
}

interface Props {
  track: FlatTrack;
  pending?: PendingChange;
  onAssign: (chapterKey: string, trackKey: string, mediaId: string, previewUrl: string) => void;
}

export function TrackRow({ track, pending, onAssign }: Props) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setErr(null);
    const problem = await validateAnimatedIcon(file);
    if (problem) {
      setErr(problem);
      return;
    }
    setUploading(true);
    try {
      const { mediaId, url } = await uploadAnimatedIcon(file, file.name);
      const previewUrl = url ?? URL.createObjectURL(file);
      if (url) rememberIcon(mediaId, url);
      onAssign(track.chapterKey, track.trackKey, mediaId, previewUrl);
    } catch (e) {
      setErr(String(e));
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="track-row">
      <div className="num">{String(track.number).padStart(2, '0')}</div>
      <div
        className={`icon-cell${drag ? ' drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {pending ? (
          <IconPreview fallbackUrl={pending.previewUrl} />
        ) : (
          <IconPreview iconRef={track.iconRef} />
        )}
      </div>
      <div>
        <div className="title">{track.title}</div>
        {uploading && <div className="pending">Uploading…</div>}
        {pending && !uploading && <div className="pending">Pending save</div>}
        {err && <div className="err">{err}</div>}
      </div>
      <div>
        <label className="secondary" style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)' }}>
          Choose GIF
          <input
            type="file"
            accept="image/gif"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
