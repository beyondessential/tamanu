# Chunked + parallel PDF rendering for large encounter records

## Problem

Encounter records with very large note counts (tens of thousands) fail to print.
The encounter record PDF is rendered client-side in a single web worker with
`@react-pdf/renderer` v3, which has no streaming: it builds the entire React
tree, Yoga layout tree, and page model in memory before emitting anything. At
high note counts this exhausts memory or exceeds the worker's readiness budget,
so the print either never completes or crashes the tab.

The current operational workaround is manual: edit the running code to slice the
notes array ~1000 at a time, generate one PDF per slice, then merge the PDFs by
hand. This productises that workaround.

## Approach

Keep rendering client-side, but split the work:

1. **Decompose** the encounter record into ordered sub-documents:
   - `main` — all non-notes sections (patient, encounter, diagnoses, procedures,
     labs, imaging, medications) + the first chunk of notes. No vitals.
   - `notes` ×N — continuation pages, one per remaining chunk of notes.
   - `vitals` — the landscape vitals pages, rendered last so page order holds.
   Vitals are bounded (max 5 pages) and don't need chunking; only notes are
   unbounded.
2. **Render in parallel** across a reused worker pool (one bounded render per
   job), capped concurrency.
3. **Merge** the resulting PDF blobs in order with `pdf-lib`, then **stamp**
   continuous `:currentPage of :totalPages` page numbers bottom-right on every
   page (react-pdf's per-document page counter can't span a merge).

Small encounters still flow through the same path: `main` + `vitals` = a 2-doc
merge. Single code path, no threshold.

## Reusable layering

The parallel-render + merge + stamp machinery is independent of "encounter
record" and lives in `packages/web/app/utils/pdf/`:

- `runPdfRenderJobs(jobs, { concurrency })` — runs an ordered
  `[{ id, props }, ...]` across a worker pool, returns ordered `Blob`s.
- `mergeAndStampPdfs(buffers, { pageNumberTemplate })` — pdf-lib merge + page
  number stamp, run inside a worker (main thread never blocks).
- `pdfRenderPlans.js` — `id -> (props) => { jobs, postProcess }`. Single-doc
  certificates return one job with `postProcess: 'none'` (unchanged behaviour);
  `encounter-record` returns the decomposed job list with
  `postProcess: 'merge-and-stamp'`.

Adding chunking to a future printout is then just a new plan builder.

## Key decisions

- **Always chunk+merge** for encounter-record (no note-count threshold) — one
  code path.
- **Global page numbers stamped post-merge** — the react-pdf footer omits the
  counter (new `showPageNumber` flag, default true so other certs are
  unaffected) and pdf-lib stamps a continuous count.
- **Chunk size 500** (`NOTES_CHUNK_SIZE`) — well clear of the per-render ceiling.
- **Concurrency cap 4** (`min(jobCount, navigator.hardwareConcurrency, 4)`) —
  bounds peak memory; honours the limit-concurrency rule.
- Translations cross the worker boundary as a resolved template string, not a
  proxied callback.

## Change set

- `packages/shared/src/utils/patientCertificates/EncounterRecordPrintout.jsx` —
  `section` prop (`main`/`notes`/`vitals`); `NotesSection` `continued` flag.
- `.../printComponents/Footer.jsx` — `showPageNumber` flag.
- `.../printComponents/MultiPageHeader.jsx` — force header on continuation first
  page.
- `packages/web/app/utils/pdf/` — pool runner + merge/stamp util (reusable).
- `packages/web/app/utils/pdf/pdfRenderPlans.js` — per-id plan builders.
- `packages/web/app/workers/pdf.worker.js` — expose `mergeAndStampPdfs`.
- `packages/web/app/utils/useRenderPDF.js` — drive via plan + pool.
- `packages/web/package.json` — add `pdf-lib`.
- Tests — section-split render test, chunking helper unit test.

## Rollout

Build on `main`, then backport to `release/2.54`. The `EncounterRecordPrintout`
footer code (`revisedBy`/`editCount`) is newer than 2.54, so that part of the
backport will need manual fixups.
