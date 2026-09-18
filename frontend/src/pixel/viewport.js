export const MIN_ZOOM = 1 / 16;

export function fitCanvasZoom(width, height, availableWidth, availableHeight) {
  const scale = Math.min(
    12,
    Math.max(1, availableWidth) / width,
    Math.max(1, availableHeight) / height,
  );
  if (scale >= 1) return Math.floor(scale);
  return Math.max(MIN_ZOOM, 2 ** Math.floor(Math.log2(scale)));
}
