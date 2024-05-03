import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { proxy, wrap } from 'comlink';
import Worker from '../workers/pdf.worker?worker';

export const pdfWorker = wrap(new Worker());
pdfWorker.onProgress(proxy(info => console.log(info)));

export const useRenderPDF = props => {
  const { data: url, isFetching, error } = useQuery(
    ['renderPDF', props.id, ...(props.queryDeps || [])],
    () => pdfWorker.renderPDFInWorker(props),
    {
      enabled: !!props.id,
    },
  );

  useEffect(() => (url ? () => URL.revokeObjectURL(url) : undefined), [url]);
  return { url, isFetching, error };
};
