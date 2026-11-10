export function calculateNormalizedCoords(
  e: React.MouseEvent<HTMLElement>,
  container: HTMLElement
): { xPercent: number; yPercent: number } {
  const rect = container.getBoundingClientRect();
  const scrollLeft = container.scrollLeft || 0;
  const scrollTop = container.scrollTop || 0;
  const scrollWidth = container.scrollWidth || rect.width;
  const scrollHeight = container.scrollHeight || rect.height;

  const clickX = e.clientX - rect.left + scrollLeft;
  const clickY = e.clientY - rect.top + scrollTop;

  const rawX = (clickX / scrollWidth) * 100;
  const rawY = (clickY / scrollHeight) * 100;

  // Strict boundary clamping so pins never bleed off edges on mobile/tablet
  const xPercent = Math.max(3.5, Math.min(96.5, rawX));
  const yPercent = Math.max(2.5, Math.min(97.5, rawY));

  return {
    xPercent: Math.round(xPercent * 10) / 10,
    yPercent: Math.round(yPercent * 10) / 10,
  };
}
