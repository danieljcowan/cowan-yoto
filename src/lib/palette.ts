// Fixed drawing palette. Index 0 is always the transparent "eraser".
// Colors chosen for readability on the Yoto player's small display.

export interface PaletteEntry {
  /** CSS hex color, or null for transparent */
  hex: string | null;
  name: string;
}

export const PALETTE: PaletteEntry[] = [
  { hex: null, name: 'Eraser (transparent)' },
  // Neutrals
  { hex: '#000000', name: 'Black' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#6b7280', name: 'Gray' },
  { hex: '#b0b7c3', name: 'Light gray' },
  { hex: '#2f3542', name: 'Charcoal' },
  // Brights
  { hex: '#ff0000', name: 'Red' },
  { hex: '#00e436', name: 'Green' },
  { hex: '#0033ff', name: 'Blue' },
  { hex: '#ffec27', name: 'Yellow' },
  { hex: '#ff00ff', name: 'Magenta' },
  { hex: '#00ffff', name: 'Cyan' },
  // Warm
  { hex: '#ff8c00', name: 'Orange' },
  { hex: '#7b1fa2', name: 'Purple' },
  { hex: '#ff1e7c', name: 'Hot pink' },
  { hex: '#00bfa5', name: 'Teal' },
  { hex: '#3ecf4a', name: 'Grass' },
  { hex: '#ff6fa9', name: 'Pink' },
  // Softs
  { hex: '#ffd400', name: 'Gold' },
  { hex: '#ff6f61', name: 'Coral' },
  { hex: '#ffb3c1', name: 'Blush' },
  { hex: '#8fd3f4', name: 'Sky' },
  { hex: '#8ee6c9', name: 'Mint' },
  { hex: '#f5df8d', name: 'Sand' },
  // Muted
  { hex: '#b39ddb', name: 'Lavender' },
  { hex: '#f7b98b', name: 'Peach' },
  { hex: '#c8e6c9', name: 'Pale green' },
  { hex: '#ffc9d4', name: 'Rose' },
  { hex: '#8d5524', name: 'Brown' },
  { hex: '#d2691e', name: 'Rust' },
  // Deeps
  { hex: '#1b5e20', name: 'Forest' },
  { hex: '#90ee90', name: 'Light green' },
  { hex: '#4169e1', name: 'Royal blue' },
  { hex: '#1e90ff', name: 'Dodger blue' },
  { hex: '#87a96b', name: 'Sage' },
  { hex: '#d2b48c', name: 'Tan' },
  // Skin tones
  { hex: '#5c3a21', name: 'Deep brown' },
  { hex: '#a0714f', name: 'Medium brown' },
  { hex: '#c68e63', name: 'Light brown' },
  { hex: '#e0ac7e', name: 'Tawny' },
  { hex: '#f1c9a5', name: 'Fair' },
  { hex: '#ffe0bd', name: 'Pale' },
  // Extras
  { hex: '#9575cd', name: 'Violet' },
  { hex: '#26a69a', name: 'Sea green' },
  { hex: '#fb8c00', name: 'Tangerine' },
  { hex: '#4a148c', name: 'Deep purple' },
  { hex: '#e879d2', name: 'Orchid' },
  { hex: '#f0e68c', name: 'Khaki' },
];

/** RGB triples aligned with PALETTE indices; transparent slot is black (unused). */
export function paletteRgb(): Array<[number, number, number]> {
  return PALETTE.map((p) => {
    if (!p.hex) return [0, 0, 0];
    const n = parseInt(p.hex.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  });
}
