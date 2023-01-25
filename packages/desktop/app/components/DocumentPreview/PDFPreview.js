import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

import { useApi } from '../../api';
import { PDFPage } from './PDFPage';

export default function PDFPreview({ attachmentId }) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

  const api = useApi();
  // const [pdfData, setPdfData] = useState();
  const [pages, setPages] = useState([]);
  const [pageCount, setPageCount] = useState();

  useEffect(() => {
    (async () => {
      if (!attachmentId) {
        return;
      }
      const { data } = await api.get(`attachment/${attachmentId}`, { base64: true });
      const raw = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const loadingTask = pdfjsLib.getDocument(raw);
      loadingTask.promise.then(
        async loadedPdf => {
          setPageCount(loadedPdf.numPages);
          const loadedPages = [];
          for (let pageIndex = 0; pageIndex < loadedPdf.numPages; ++pageIndex) {
            loadedPages.push(await loadedPdf.getPage(pageIndex + 1));
          }
          setPages(loadedPages);
        },
        error => {
          throw new Error(error);
        },
      );
    })();
  }, [attachmentId, api, pageCount]);

  return (
    <>
      {pages.map(p => (
        <PDFPage page={p} />
      ))}
    </>
  );
}
