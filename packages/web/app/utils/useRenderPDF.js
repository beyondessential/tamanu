import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { releaseProxy, wrap } from 'comlink';
import Worker from '../workers/pdf.worker?worker';

const renderPDFInWorker = async props => {
  const worker = new Worker();
  const pdfWorker = wrap(worker);

  try {
    const pdf = await pdfWorker.renderPDFInWorker(props);
    return URL.createObjectURL(pdf);
  } finally {
    pdfWorker[releaseProxy]?.();
    worker.terminate();
  }
};

export const useRenderPDF = (props) => {
  const {
    data: url,
    isFetching,
    error,
  } = useQuery(
    ['renderPDF', props.id, ...(props.queryDeps || [])],
    () => renderPDFInWorker(props),
    {
      enabled: !!props.id,
    },
  );

  useEffect(() => {
    if (!url) {
      return undefined;
    }

    return () => URL.revokeObjectURL(url);
  }, [url]);

  return { url, isFetching, error };
};
