import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

import { useApi } from '../../api';

export default function PDFPreview({ attachmentId }) {
  const canvasRef = useRef();
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

  const api = useApi();
  const [pdfData, setPdfData] = useState();
  const [currentPage, setCurrentPage] = useState(1);

  const renderPage = useCallback(
    (pageNumber, pdf = pdfData) =>
      pdf &&
      pdf.getPage(pageNumber).then(page => {
        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport,
        };
        page.render(renderContext);
      }),
    [pdfData],
  );

  useEffect(() => {
    renderPage(currentPage, pdfData);
  }, [pdfData, currentPage, renderPage]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`attachment/${attachmentId}`, { base64: true });
      const raw = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const loadingTask = pdfjsLib.getDocument(raw);
      loadingTask.promise.then(
        loadedPdf => {
          setPdfData(loadedPdf);
        },
        error => {
          throw new Error(error);
        },
      );
    })();
  }, [attachmentId, api]);

  const nextPage = () =>
    pdfData && currentPage < pdfData.numPages && setCurrentPage(currentPage + 1);

  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return <canvas ref={canvasRef} />;
}
