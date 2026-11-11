export interface PagePalette {
  name: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
  hex: string;
}

export const PAGE_PALETTES: PagePalette[] = [
  { name: "Blue", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400", hex: "#3b82f6" },
  { name: "Emerald", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400", hex: "#10b981" },
  { name: "Amber", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400", hex: "#f59e0b" },
  { name: "Purple", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-400", hex: "#a855f7" },
  { name: "Rose", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-400", hex: "#f43f5e" },
  { name: "Cyan", bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-400", hex: "#06b6d4" },
  { name: "Orange", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400", hex: "#f97316" },
];

export function getPageColor(urlOrPath: string = "/"): PagePalette {
  let clean = urlOrPath;
  try {
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      const u = new URL(urlOrPath);
      clean = u.pathname;
    }
  } catch {}

  clean = clean.replace(/\/$/, "") || "/";

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PAGE_PALETTES.length;
  return PAGE_PALETTES[index];
}

export function formatPageLabel(urlOrPath: string = "/"): string {
  try {
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      const u = new URL(urlOrPath);
      const p = u.pathname;
      return p === "" || p === "/" ? "Home (/)" : p;
    }
    return urlOrPath === "" || urlOrPath === "/" ? "Home (/)" : urlOrPath;
  } catch {
    return urlOrPath || "Home (/)";
  }
}
