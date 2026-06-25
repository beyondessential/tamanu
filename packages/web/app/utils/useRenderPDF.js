import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../contexts/Translation';
import { buildPdfRenderPlan } from './pdf/pdfRenderPlans';
import { renderPlanToBlob } from './pdf/runPdfRenderJobs';

export const useRenderPDF = props => {
  const { getTranslation } = useTranslation();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(null);

  const queryKey = ['renderPDF', props.id, ...(props.queryDeps || [])];

  const {
    data: url,
    isFetching,
    error,
  } = useQuery(
    queryKey,
    async ({ signal }) => {
      setProgress(null);
      const plan = buildPdfRenderPlan(props);
      // Merged plans number their pages by stamping after the merge; resolve the (localised)
      // footer template here so the worker can fill in the page numbers without a translation
      // context of its own.
      const pageNumberTemplate =
        plan.postProcess === 'merge-and-stamp'
          ? getTranslation('pdf.pagination', ':currentPage of :totalPages')
          : undefined;
      const blob = await renderPlanToBlob(
        { ...plan, pageNumberTemplate },
        { onProgress: setProgress, signal },
      );
      return URL.createObjectURL(blob);
    },
    {
      enabled: !!props.id,
    },
  );

  // Cancel an in-flight render when the viewer unmounts (e.g. the modal is closed) so we stop
  // rendering chunks and don't waste work merging a PDF nobody will see. cancelQueries aborts the
  // signal passed to the query function above.
  useEffect(
    () => () => {
      queryClient.cancelQueries({ queryKey });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, props.id, ...(props.queryDeps || [])],
  );

  useEffect(() => {
    if (!url) {
      return undefined;
    }

    return () => URL.revokeObjectURL(url);
  }, [url]);

  return { url, isFetching, error, progress };
};
