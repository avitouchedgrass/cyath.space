export function calculateNormalizedCoords(
  e: React.MouseEvent<HTMLElement>,
  containerRect: DOMRect
): { xPercent: number; yPercent: number } {
  const clickX = e.clientX - containerRect.left;
  const clickY = e.clientY - containerRect.top;

  const xPercent = Math.max(0, Math.min(100, (clickX / containerRect.width) * 100));
  const yPercent = Math.max(0, Math.min(100, (clickY / containerRect.height) * 100));

  return {
    xPercent: Math.round(xPercent * 100) / 100,
    yPercent: Math.round(yPercent * 100) / 100,
  };
}

