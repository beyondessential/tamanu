import { expose } from 'comlink';
import './workerShim';

const renderPDFInWorker = async (props) => {
  const { renderPDF } = await import('../renderPDF');
  return renderPDF(props);
};

const mergeAndStampPdfsInWorker = async (args) => {
  const { mergeAndStampPdfs } = await import('../mergePdf');
  return mergeAndStampPdfs(args);
};

expose({ renderPDFInWorker, mergeAndStampPdfsInWorker });
Promise.resolve().then(() => {
  self.postMessage({ type: 'pdf-render-ready' });
});
