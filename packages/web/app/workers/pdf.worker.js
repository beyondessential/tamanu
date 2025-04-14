import { expose } from 'comlink';
import './workerShim';

const renderPDFInWorker = async (props) => {
  const { renderPDF } = await import('../renderPDF');
  const pdf = await renderPDF(props);
  return URL.createObjectURL(pdf);
};

expose({ renderPDFInWorker });
