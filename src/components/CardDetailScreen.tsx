import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { getCard, saveCard } from '../api/content';
import { uploadAnimatedIcon } from '../api/icons';
import { validateAnimatedIcon } from '../lib/gifValidate';
import { flattenTracks, setTrackIcon, type FlatTrack } from '../lib/mutate';
import type { Card } from '../types';
import { TrackRow, type PendingChange } from './TrackRow';

interface Props {
  cardId: string;
  onBack: () => void;
  toast: (msg: string, kind?: 'good' | 'bad') => void;
}

type PendingMap = Record<string, PendingChange>;

function trackKeyId(t: FlatTrack): string {
  return `${t.chapterKey}::${t.trackKey}`;
}

export function CardDetailScreen({ cardId, onBack, toast }: Props) {
  const [card, setCard] = useState<Card | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMap>({});
  const [saving, setSaving] = useState(false);
  const [bulkDrag, setBulkDrag] = useState(false);

  useEffect(() => {
    getCard(cardId)
      .then((c) => {
        setCard(c);
        setPending({});
      })
      .catch((e) => setErr(String(e)));
  }, [cardId]);

  const tracks = useMemo(() => (card ? flattenTracks(card) : []), [card]);
  const changeCount = Object.keys(pending).length;

  function onAssign(chapterKey: string, trackKey: string, mediaId: string, previewUrl: string) {
    const key = `${chapterKey}::${trackKey}`;
    setPending((p) => ({ ...p, [key]: { mediaId, previewUrl } }));
  }

  async function onSave() {
    if (!card) return;
    setSaving(true);
    try {
      let mutated = card;
      for (const t of tracks) {
        const change = pending[trackKeyId(t)];
        if (change) {
          mutated = setTrackIcon(mutated, t.chapterKey, t.trackKey, change.mediaId);
        }
      }
      const saved = await saveCard(mutated);
      setCard(saved);
      setPending({});
      toast(`Saved ${changeCount} icon${changeCount === 1 ? '' : 's'}`, 'good');
    } catch (e) {
      toast(`Save failed: ${e}`, 'bad');
    } finally {
      setSaving(false);
    }
  }

  async function onBulkDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setBulkDrag(false);
    if (!card) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    const matches: Array<{ track: FlatTrack; file: File }> = [];
    for (const f of files) {
      if (!/\.gif$/i.test(f.name)) continue;
      const base = f.name.replace(/\.gif$/i, '');
      const byKey = tracks.find((t) => t.trackKey === base || t.trackKey === base.padStart(2, '0'));
      const byNum = tracks.find((t) => String(t.number).padStart(2, '0') === base.padStart(2, '0'));
      const target = byKey ?? byNum;
      if (target) matches.push({ track: target, file: f });
    }
    if (matches.length === 0) {
      toast('No GIFs matched a track by name', 'bad');
      return;
    }
    for (const { track, file } of matches) {
      const problem = await validateAnimatedIcon(file);
      if (problem) {
        toast(`${file.name}: ${problem}`, 'bad');
        continue;
      }
      try {
        const { mediaId, url } = await uploadAnimatedIcon(file, file.name);
        const previewUrl = url ?? URL.createObjectURL(file);
        onAssign(track.chapterKey, track.trackKey, mediaId, previewUrl);
      } catch (e) {
        toast(`${file.name}: ${e}`, 'bad');
      }
    }
  }

  if (err) return <div className="empty-state">Couldn't load card: {err}</div>;
  if (!card) return <div className="empty-state">Loading card…</div>;

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← All cards
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          {card.title ?? 'Untitled'}
          {changeCount > 0 && <span className="badge">{changeCount} change{changeCount === 1 ? '' : 's'}</span>}
        </h2>
        <button disabled={changeCount === 0 || saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="track-list">
        {tracks.map((t) => (
          <TrackRow
            key={trackKeyId(t)}
            track={t}
            pending={pending[trackKeyId(t)]}
            onAssign={onAssign}
          />
        ))}
      </div>

      <div
        className={`bulk-drop${bulkDrag ? ' drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setBulkDrag(true);
        }}
        onDragLeave={() => setBulkDrag(false)}
        onDrop={onBulkDrop}
      >
        Drop a bunch of GIFs here to auto-pair by filename (<code>01.gif</code> → track 01).
      </div>
    </div>
  );
}
