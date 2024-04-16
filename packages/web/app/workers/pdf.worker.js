import { expose } from 'comlink';
import './workerShim';

const renderPDFInWorker = async props => {
  const { renderPDF } = await import('../renderPDF');
  return URL.createObjectURL(await renderPDF(props));
};

expose({ renderPDFInWorker });
