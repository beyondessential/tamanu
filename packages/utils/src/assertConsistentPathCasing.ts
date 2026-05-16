import fs from 'fs';

// On Windows, Node's filesystem APIs accept any case but `require.cache` is
// case-sensitive. Launching the process from a non-canonical case (e.g.
// `cd C:\tamanu\…` when the install lives at `C:\Tamanu\…`) causes the same
// module to be loaded twice under different cache keys. `instanceof` checks
// across the duplicates then silently fail, with downstream effects that are
// far removed from the cause (e.g. sequelize emitting "Support for literal
// replacements in the `where` object has been removed" because its internal
// `Where` class doesn't match the `Where` an upstream caller constructed).
//
// Call this from each server entry point before any further work — even though
// resolving this import already crosses one @tamanu boundary, the worst case
// is one extra cache entry before we exit.
export function assertConsistentPathCasing(): void {
  if (process.platform !== 'win32') return;

  for (const [label, given] of [
    ['cwd', process.cwd()],
    ['script directory', __dirname],
  ] as const) {
    let canonical: string;
    try {
      canonical = fs.realpathSync.native(given);
    } catch {
      continue;
    }
    if (canonical !== given) {
      // eslint-disable-next-line no-console
      console.error(
        [
          '',
          'FATAL: install path casing mismatch',
          `  ${label}:`,
          `    given:     ${given}`,
          `    canonical: ${canonical}`,
          '',
          "Node's require.cache is case-sensitive on Windows, so launching from a",
          'non-canonical casing loads modules twice and silently breaks `instanceof`',
          'checks across the duplicates. Re-launch using the canonical casing.',
          '',
        ].join('\n'),
      );
      process.exit(1);
    }
  }
}
