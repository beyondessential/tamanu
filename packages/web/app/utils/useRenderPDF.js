import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { releaseProxy, wrap } from 'comlink';
import Worker from '../workers/pdf.worker?worker';

const waitForWorkerReady = worker =>
  new Promise((resolve, reject) => {
    const handleTimeout = setTimeout(() => {
      cleanup();
      reject(new Error('PDF worker did not signal readiness within 5 minutes'));
    }, 5 * 60 * 1000);

    const handleMessage = event => {
      if (event.data?.type !== 'pdf-render-ready') {
        return;
      }
      cleanup();
      resolve();
    };

    const handleError = error => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      clearTimeout(handleTimeout);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
  });

const renderPDFInWorker = async props => {
  const worker = new Worker();
  const workerReady = waitForWorkerReady(worker);
  const pdfWorker = wrap(worker);

  try {
    await workerReady;
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
