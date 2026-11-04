// spec: TPAGE#large-page-sizes
// The page sizes offered by the tables that show many rows at a time
export const LARGE_ROWS_PER_PAGE_OPTIONS = [50, 100] as const;

// The largest page any table asks a server for
export const MAX_ROWS_PER_PAGE = Math.max(...LARGE_ROWS_PER_PAGE_OPTIONS);
