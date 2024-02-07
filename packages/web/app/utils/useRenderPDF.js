import { useEffect } from 'react';
import { useAsync } from 'react-use';
import { proxy, wrap } from 'comlink';
import Worker from '../workers/pdf.worker?worker';

export const pdfWorker = wrap(new Worker());
pdfWorker.onProgress(proxy(info => console.log(info)));

export const useRenderPDF = props => {
  const { value: url, loading, error } = useAsync(async () => {
    return pdfWorker.renderPDFInWorker(props);
  }, []);

  useEffect(() => (url ? () => URL.revokeObjectURL(url) : undefined), [url]);
  return { url, loading, error };
};
