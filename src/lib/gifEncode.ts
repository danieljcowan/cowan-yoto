// Minimal dependency-free GIF89a encoder for palette-indexed frames.
// Designed for tiny animated icons: fixed global palette, transparency,
// infinite loop, uniform frame delay.

export interface GifEncodeOptions {
  width: number;
  height: number;
  /** RGB triples; length is padded to the next power of two internally. */
  palette: Array<[number, number, number]>;
  /** Frame delay in hundredths of a second (10 = 100ms = 10fps). */
  delayCs: number;
  /** Palette index treated as transparent. Defaults to 0. */
  transparentIndex?: number;
}

/**
 * Encode frames (each a width*height array of palette indices) into an
 * animated GIF Blob. Runs entirely in memory — no canvas, no network.
 */
export function encodeGif(frames: Uint8Array[], opts: GifEncodeOptions): Blob {
  const { width, height, delayCs } = opts;
  const transparentIndex = opts.transparentIndex ?? 0;

  // Pad palette to a power of two (min 4 entries per GIF spec practicality).
  let tableSize = 4;
  let sizeField = 1; // 2^(sizeField+1) = tableSize
  while (tableSize < opts.palette.length) {
    tableSize <<= 1;
    sizeField++;
  }
  const minCodeSize = Math.max(2, sizeField + 1);

  const out: number[] = [];
  const u16 = (v: number) => {
    out.push(v & 0xff, (v >> 8) & 0xff);
  };

  // Header + Logical Screen Descriptor
  for (const c of 'GIF89a') out.push(c.charCodeAt(0));
  u16(width);
  u16(height);
  out.push(0x80 | ((sizeField & 0x07) << 4) | (sizeField & 0x07)); // GCT present
  out.push(0); // background color index
  out.push(0); // pixel aspect ratio

  // Global Color Table
  for (let i = 0; i < tableSize; i++) {
    const [r, g, b] = opts.palette[i] ?? [0, 0, 0];
    out.push(r, g, b);
  }

  // NETSCAPE looping extension (loop forever)
  out.push(0x21, 0xff, 0x0b);
  for (const c of 'NETSCAPE2.0') out.push(c.charCodeAt(0));
  out.push(0x03, 0x01, 0x00, 0x00, 0x00);

  for (const frame of frames) {
    // Graphic Control Extension: disposal=2 (restore to bg), transparency on
    out.push(0x21, 0xf9, 0x04, 0x09);
    u16(delayCs);
    out.push(transparentIndex, 0x00);

    // Image Descriptor (full frame, no local color table)
    out.push(0x2c);
    u16(0);
    u16(0);
    u16(width);
    u16(height);
    out.push(0x00);

    // LZW-compressed pixel data
    out.push(minCodeSize);
    const compressed = lzwEncode(frame, minCodeSize);
    for (let i = 0; i < compressed.length; i += 255) {
      const chunk = compressed.slice(i, i + 255);
      out.push(chunk.length, ...chunk);
    }
    out.push(0x00); // block terminator
  }

  out.push(0x3b); // trailer
  return new Blob([new Uint8Array(out)], { type: 'image/gif' });
}

/** Standard GIF LZW compression (mirrors the widely-used omggif ordering). */
function lzwEncode(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  const bytes: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  let codeSize = minCodeSize + 1;

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  let table = new Map<number, number>();
  let nextCode = eoiCode + 1;

  emit(clearCode);

  let curCode = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (curCode << 8) | k;
    const found = table.get(key);
    if (found !== undefined) {
      curCode = found;
      continue;
    }
    emit(curCode);
    if (nextCode === 4096) {
      emit(clearCode);
      table = new Map();
      nextCode = eoiCode + 1;
      codeSize = minCodeSize + 1;
    } else {
      if (nextCode >= 1 << codeSize) codeSize++;
      table.set(key, nextCode++);
    }
    curCode = k;
  }
  emit(curCode);
  emit(eoiCode);
  if (bitCount > 0) bytes.push(bitBuffer & 0xff);
  return bytes;
}
