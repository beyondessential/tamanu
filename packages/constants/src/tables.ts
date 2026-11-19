// spec: TPAGE#large-page-sizes
// The page sizes offered by the tables that show many rows at a time
export const LARGE_ROWS_PER_PAGE_OPTIONS = [50, 100] as const;

// The largest page any table asks a server for. Servers cap the pages they return at this, so
// offering a larger size raises those caps too. They follow the offered sizes because a server
// returning less than the page a table asked for leaves the table's paging wrong.
export const MAX_ROWS_PER_PAGE = Math.max(...LARGE_ROWS_PER_PAGE_OPTIONS);
