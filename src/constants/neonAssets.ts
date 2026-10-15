import type { Letter } from "../types/game";

// 1. Extend AssetKey to include "WILD" alongside standard letters 'A'-'Z'
export type AssetKey = Letter | "WILD";

// Automatically scans all letter photos inside src/photo-letters/ (subfolders or root)
const imageModules = import.meta.glob<string>(
  "../photo-letters/**/*.{jpg,jpeg,png,webp}",
  { eager: true, query: "?url", import: "default" },
);

// 2. Update type annotation from Record<Letter, string[]> to Record<AssetKey, string[]>
export const NEON_ASSET_REGISTRY: Record<AssetKey, string[]> = {
  A: [],
  B: [],
  C: [],
  D: [],
  E: [],
  F: [],
  G: [],
  H: [],
  I: [],
  J: [],
  K: [],
  L: [],
  M: [],
  N: [],
  O: [],
  P: [],
  Q: [],
  R: [],
  S: [],
  T: [],
  U: [],
  V: [],
  W: [],
  X: [],
  Y: [],
  Z: [],
  WILD: [], // 👈 Now valid under AssetKey!
};

// Populate the registry with bundled asset URLs
Object.entries(imageModules).forEach(([path, url]) => {
  // Option 0: Check for wild card subfolder or wild image name, e.g. "/photo-letters/wild/" or "wild.jpeg"
  if (/\/photo-letters\/.*wild/i.test(path)) {
    NEON_ASSET_REGISTRY.WILD.push(url);
    return;
  }

  // Option A: Extract from subfolder, e.g. "/photo-letters/A/a25.jpg"
  let match = path.match(/\/photo-letters\/([A-Z])\//i);

  // Option B: Fallback to match directly from filename prefix, e.g. "/photo-letters/A25.jpg" or "/photo-letters/A-25.jpg"
  if (!match) {
    match = path.match(/\/photo-letters\/([A-Z])-?\d+/i);
  }

  if (match) {
    const letter = match[1].toUpperCase() as Letter;
    if (NEON_ASSET_REGISTRY[letter]) {
      NEON_ASSET_REGISTRY[letter].push(url);
    }
  }
});
