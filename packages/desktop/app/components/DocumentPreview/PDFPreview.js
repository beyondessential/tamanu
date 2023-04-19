import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

import styled from 'styled-components';
import { useApi } from '../../api';
import { PDFPage } from './PDFPage';

// Prevent the modal header scrolling away by making the preview scrollable
const PDFDocument = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 75vh;
`;

// Calculate which page we're scrolled to "Page X of Y"
function getScrollPage(element, pageCount) {
  if (!element) {
    return NaN;
  }
  const height = element.scrollHeight - element.clientHeight;
  return element.scrollTop > 0 ? Math.ceil((element.scrollTop / height) * pageCount) : 1;
}

export default function PDFPreview({
  attachmentId,
  pageCount,
  setPageCount,
  scrollPage,
  setScrollPage,
}) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

  const api = useApi();
  const [pages, setPages] = useState([]);

  const scrollRef = useRef(null);

  // Fetch raw PDF data from tamanu api
  // Pass data to PDF loader and generate pages
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
  }, [attachmentId, api, pageCount, setPageCount]);

  // Listen for scroll events
  // Approximate current page number from scroll percent
  useEffect(() => {
    const node = scrollRef.current;
    const reportScroll = e => {
      setScrollPage(getScrollPage(e.target, pageCount));
    };
    if (node !== null) {
      node.addEventListener('scroll', reportScroll, { passive: true });
      if (Number.isNaN(scrollPage)) {
        setScrollPage(getScrollPage(node, pageCount));
      }
    }
    return () => {
      if (node !== null) {
        node.removeEventListener('scroll', reportScroll);
      }
    };
  }, [scrollPage, setScrollPage, pageCount]);

  return (
    <PDFDocument ref={scrollRef}>
      {pages.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <PDFPage page={p} key={i} parentRef={scrollRef} />
      ))}
    </PDFDocument>
  );
}
