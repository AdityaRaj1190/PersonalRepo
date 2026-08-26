export function formatDegree(deg) {
  const d = Math.floor(deg);
  const minutesFloat = (deg - d) * 60;
  const m = Math.floor(minutesFloat);
  const s = Math.round((minutesFloat - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}
