export const PAGE_COLORS: Record<
  string,
  { bg: string; accent: string; primary: string; secondary: string }
> = {
  "/": { bg: "#f3fcff", accent: "#ff9e2f", primary: "#1a1a1a", secondary: "#2e2e2e" },
  "/about": { bg: "#f3fff0", accent: "#5c9cfd", primary: "#1a1a1a", secondary: "#2e2e2e" },
  "/blog": { bg: "#e4e8ec", accent: "#e22b62", primary: "#1a1a1a", secondary: "#2e2e2e" },
  "/photography": { bg: "#fffbd2", accent: "#ff8090", primary: "#1a1a1a", secondary: "#2e2e2e" },
  "/projects": { bg: "#141313", accent: "#74da58", primary: "#eaeaea", secondary: "#b8b8b8" },
  "/resume": { bg: "#e4fefc", accent: "#8047fd", primary: "#141416", secondary: "#2e2d39" },
};

/**
 * Resolves colors for a given pathname.
 * Falls back to blog colors for /posts/* routes, then home colors as default.
 */
export function getPageColors(pathname: string) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return (
    PAGE_COLORS[normalized] ??
    (normalized.startsWith("/posts") ? PAGE_COLORS["/blog"] : null) ??
    PAGE_COLORS["/"]
  );
}
