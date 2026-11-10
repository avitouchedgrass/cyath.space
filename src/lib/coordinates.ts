export function calculateNormalizedCoords(
  e: React.MouseEvent<HTMLElement>,
  container: HTMLElement
): { xPercent: number; yPercent: number } {
  const rect = container.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const rawX = (clickX / (rect.width || 1)) * 100;
  const rawY = (clickY / (rect.height || 1)) * 100;

  // Clamped within 2.5% - 97.5% so pin markers never bleed off boundary edges
  const xPercent = Math.max(2.5, Math.min(97.5, rawX));
  const yPercent = Math.max(1.5, Math.min(98.5, rawY));

  return {
    xPercent: Math.round(xPercent * 10) / 10,
    yPercent: Math.round(yPercent * 10) / 10,
  };
}
