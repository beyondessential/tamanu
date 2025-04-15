import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wrap } from 'comlink';
import Worker from '../workers/pdf.worker?worker';

export const pdfWorker = wrap(new Worker());

export const useRenderPDF = (props) => {
  const {
    data: url,
    isFetching,
    error,
  } = useQuery(
    ['renderPDF', props.id, ...(props.queryDeps || [])],
    () => pdfWorker.renderPDFInWorker(props),
    {
      enabled: !!props.id,
    },
  );

  useEffect(() => (url ? () => URL.revokeObjectURL(url) : undefined), [url]);
  return { url, isFetching, error };
};
