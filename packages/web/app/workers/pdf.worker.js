import { expose } from 'comlink';
import './workerShim';

const renderPDFInWorker = async (props) => {
  const { renderPDF } = await import('../renderPDF');
  return renderPDF(props);
};

expose({ renderPDFInWorker });
Promise.resolve().then(() => {
  self.postMessage({ type: 'pdf-render-ready' });
});
