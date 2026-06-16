import { MAX_WORKERS, withPooledWorker } from './pdfWorkerPool';

/**
 * Render a PDF plan to a single Blob.
 *
 * A plan is `{ jobs, postProcess, pageNumberTemplate }`. Each job is a renderPDF props bag.
 * With `postProcess: 'merge-and-stamp'` the rendered chunks are merged into one document and a
 * continuous page-number footer is stamped on; otherwise the single rendered Blob is returned.
 *
 * Every render and the merge run on the shared worker pool (see pdfWorkerPool), so they share a
 * global concurrency cap across all in-flight renders and never block the main thread.
 *
 * `onProgress({ completed, total })` is called as each chunk finishes and again when the merge
 * does. The total counts every render job plus the merge step (when there is one), so the merge
 * is just the final unit of progress.
 *
 * Progress is only reported when the render spans more than one pool wave (more jobs than
 * workers); a render that fits in a single wave finishes too quickly for a bar to be useful, so
 * the caller shows a plain spinner instead.
 */
export const renderPlanToBlob = async (
  { jobs, postProcess = 'none', pageNumberTemplate },
  { onProgress, signal } = {},
) => {
  const total = jobs.length + (postProcess === 'merge-and-stamp' ? 1 : 0);
  let completed = 0;
  const shouldReport = Boolean(onProgress) && jobs.length > MAX_WORKERS;
  const report = () => {
    if (shouldReport) {
      onProgress({ completed, total });
    }
  };
  report();

  // Submitting every job at once lets the pool fill all its workers; results stay in job order.
  // The signal lets queued (not-yet-started) chunks bail if the render is cancelled mid-flight.
  const blobs = await Promise.all(
    jobs.map(job =>
      withPooledWorker(proxy => proxy.renderPDFInWorker(job), { signal }).then(blob => {
        completed += 1;
        report();
        return blob;
      }),
    ),
  );

  if (postProcess !== 'merge-and-stamp') {
    return blobs[0];
  }

  // Skip the (expensive) merge if the render was cancelled while the chunks were rendering.
  if (signal?.aborted) {
    throw signal.reason ?? new Error('PDF render cancelled');
  }

  // Pass the Blobs straight to the merge worker — structured clone shares their bytes, so they're
  // never materialised as ArrayBuffers on the main thread; the worker reads each one in turn.
  const merged = await withPooledWorker(
    proxy => proxy.mergeAndStampPdfsInWorker({ blobs, pageNumberTemplate }),
    { signal },
  );
  completed += 1;
  report();
  return merged;
};
