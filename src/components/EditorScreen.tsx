import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { PALETTE, paletteRgb } from '../lib/palette';
import { encodeGif } from '../lib/gifEncode';

const SIZE = 16;
const MAX_FRAMES = 24;
const DELAY_MS = 100; // fixed 10fps
const RGB = paletteRgb();

type Grid = Uint8Array;

interface Snapshot {
  frames: Grid[];
  cur: number;
}

interface Props {
  onApply: (gif: Blob) => void;
}

function blankGrid(): Grid {
  return new Uint8Array(SIZE * SIZE);
}

function drawChecker(ctx: CanvasRenderingContext2D, cell: number) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#3a4150' : '#2e3441';
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
}

function drawPixels(ctx: CanvasRenderingContext2D, grid: Grid, cell: number, alpha = 1) {
  ctx.globalAlpha = alpha;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = grid[y * SIZE + x];
      if (idx === 0) continue;
      const [r, g, b] = RGB[idx];
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  ctx.globalAlpha = 1;
}

function FrameThumb({
  grid,
  selected,
  label,
  onClick,
}: {
  grid: Grid;
  selected: boolean;
  label: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    drawChecker(ctx, 2);
    drawPixels(ctx, grid, 2);
  }, [grid]);
  return (
    <button
      className={`frame-thumb${selected ? ' selected' : ''}`}
      onClick={onClick}
      title={`Frame ${label}`}
    >
      <canvas ref={ref} width={32} height={32} />
      <span>{label}</span>
    </button>
  );
}

export function EditorScreen({ onApply }: Props) {
  const [frames, setFrames] = useState<Grid[]>([blankGrid()]);
  const [cur, setCur] = useState(0);
  const [color, setColor] = useState(1); // black
  const [showGrid, setShowGrid] = useState(true);
  const [onion, setOnion] = useState(true);
  const [playIdx, setPlayIdx] = useState(0);
  const [, bump] = useState(0);

  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const stroking = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  // ---- history ----
  function pushUndo() {
    undoStack.current.push({ frames, cur });
    if (undoStack.current.length > 60) undoStack.current.shift();
    redoStack.current = [];
    bump((n) => n + 1);
  }
  function undo() {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push({ frames, cur });
    setFrames(prev.frames);
    setCur(Math.min(prev.cur, prev.frames.length - 1));
    bump((n) => n + 1);
  }
  function redo() {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push({ frames, cur });
    setFrames(next.frames);
    setCur(Math.min(next.cur, next.frames.length - 1));
    bump((n) => n + 1);
  }

  // ---- painting ----
  function cellFromEvent(e: PointerEvent<HTMLCanvasElement>): number | null {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
    return y * SIZE + x;
  }

  function paint(i: number) {
    setFrames((fs) => {
      if (fs[cur][i] === color) return fs;
      const nf = fs.slice();
      const g = new Uint8Array(nf[cur]);
      g[i] = color;
      nf[cur] = g;
      return nf;
    });
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pushUndo();
    stroking.current = true;
    const i = cellFromEvent(e);
    if (i !== null) paint(i);
  }
  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!stroking.current) return;
    const i = cellFromEvent(e);
    if (i !== null) paint(i);
  }
  function onPointerUp() {
    stroking.current = false;
  }

  // ---- frame ops ----
  function addFrame(copy: boolean) {
    if (frames.length >= MAX_FRAMES) return;
    pushUndo();
    const nf = frames.slice();
    nf.splice(cur + 1, 0, copy ? new Uint8Array(frames[cur]) : blankGrid());
    setFrames(nf);
    setCur(cur + 1);
  }
  function deleteFrame() {
    if (frames.length <= 1) return;
    pushUndo();
    const nf = frames.slice();
    nf.splice(cur, 1);
    setFrames(nf);
    setCur(Math.max(0, cur - (cur === nf.length ? 1 : 0)));
  }
  function moveFrame(dir: -1 | 1) {
    const to = cur + dir;
    if (to < 0 || to >= frames.length) return;
    pushUndo();
    const nf = frames.slice();
    [nf[cur], nf[to]] = [nf[to], nf[cur]];
    setFrames(nf);
    setCur(to);
  }
  function clearFrame() {
    pushUndo();
    const nf = frames.slice();
    nf[cur] = blankGrid();
    setFrames(nf);
  }

  // ---- main canvas render ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const cell = canvas.width / SIZE;
    drawChecker(ctx, cell);
    if (onion && cur > 0) drawPixels(ctx, frames[cur - 1], cell, 0.3);
    drawPixels(ctx, frames[cur], cell);
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell + 0.5, 0);
        ctx.lineTo(i * cell + 0.5, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell + 0.5);
        ctx.lineTo(canvas.width, i * cell + 0.5);
        ctx.stroke();
      }
    }
  }, [frames, cur, showGrid, onion]);

  // ---- animated preview ----
  useEffect(() => {
    const t = setInterval(() => {
      setPlayIdx((i) => (i + 1) % frames.length);
    }, DELAY_MS);
    return () => clearInterval(t);
  }, [frames.length]);

  useEffect(() => {
    const ctx = previewRef.current?.getContext('2d');
    if (!ctx) return;
    const grid = frames[Math.min(playIdx, frames.length - 1)];
    drawChecker(ctx, 1);
    drawPixels(ctx, grid, 1);
  }, [frames, playIdx]);

  // ---- output ----
  function makeGif(): Blob {
    return encodeGif(frames, {
      width: SIZE,
      height: SIZE,
      palette: RGB,
      delayCs: DELAY_MS / 10,
    });
  }
  function download() {
    const url = URL.createObjectURL(makeGif());
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yoto-icon.gif';
    a.click();
    URL.revokeObjectURL(url);
  }

  const isDrawn = frames.some((f) => f.some((v) => v !== 0));

  return (
    <div className="editor">
      <div className="editor-main">
        <canvas
          ref={canvasRef}
          className="pixel-canvas"
          width={480}
          height={480}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        <div className="editor-tools">
          <button className="secondary" onClick={undo} disabled={undoStack.current.length === 0}>
            ↩ Undo
          </button>
          <button className="secondary" onClick={redo} disabled={redoStack.current.length === 0}>
            ↪ Redo
          </button>
          <button className="secondary" onClick={clearFrame}>
            Clear frame
          </button>
          <button className="secondary" onClick={() => setShowGrid((v) => !v)}>
            {showGrid ? 'Hide grid' : 'Show grid'}
          </button>
          <button className="secondary" onClick={() => setOnion((v) => !v)}>
            {onion ? 'Onion skin: on' : 'Onion skin: off'}
          </button>
        </div>

        <div className="frame-bar">
          <div className="frame-strip">
            {frames.map((f, i) => (
              <FrameThumb
                key={i}
                grid={f}
                selected={i === cur}
                label={i + 1}
                onClick={() => setCur(i)}
              />
            ))}
          </div>
          <div className="frame-actions">
            <span className="frame-count">
              {frames.length} / {MAX_FRAMES} frames · 10 fps
            </span>
            <button
              className="secondary"
              onClick={() => addFrame(false)}
              disabled={frames.length >= MAX_FRAMES}
            >
              + Blank
            </button>
            <button
              className="secondary"
              onClick={() => addFrame(true)}
              disabled={frames.length >= MAX_FRAMES}
            >
              ⧉ Duplicate
            </button>
            <button className="secondary" onClick={() => moveFrame(-1)} disabled={cur === 0}>
              ◀
            </button>
            <button
              className="secondary"
              onClick={() => moveFrame(1)}
              disabled={cur === frames.length - 1}
            >
              ▶
            </button>
            <button className="secondary" onClick={deleteFrame} disabled={frames.length <= 1}>
              🗑
            </button>
          </div>
        </div>
      </div>

      <div className="editor-side">
        <div className="panel">
          <h3>Colors</h3>
          <div className="selected-color">
            {PALETTE[color].hex ? (
              <span className="swatch-big" style={{ background: PALETTE[color].hex! }} />
            ) : (
              <span className="swatch-big checker" />
            )}
            <span>{PALETTE[color].name}</span>
          </div>
          <div className="palette-grid">
            {PALETTE.map((p, i) => (
              <button
                key={i}
                className={`swatch${i === color ? ' selected' : ''}${p.hex ? '' : ' checker'}`}
                style={p.hex ? { background: p.hex } : undefined}
                title={p.name}
                onClick={() => setColor(i)}
              >
                {!p.hex && '×'}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Preview</h3>
          <div className="preview-row">
            <div>
              <div className="preview-label">Animated</div>
              <canvas ref={previewRef} width={16} height={16} className="preview-big" />
            </div>
            <div>
              <div className="preview-label">Actual size</div>
              <canvas
                width={16}
                height={16}
                className="preview-actual"
                ref={(el) => {
                  const ctx = el?.getContext('2d');
                  if (!ctx) return;
                  drawChecker(ctx, 1);
                  drawPixels(ctx, frames[Math.min(playIdx, frames.length - 1)], 1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="panel apply-panel">
          <button className="apply-btn" onClick={() => onApply(makeGif())} disabled={!isDrawn}>
            Apply to a card →
          </button>
          <button className="secondary" onClick={download} disabled={!isDrawn}>
            Download .gif
          </button>
        </div>
      </div>
    </div>
  );
}
