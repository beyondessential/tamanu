import React, { useEffect, useRef } from 'react';

export function PDFPage({ page, parentRef }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!page) {
      return;
    }
    const [, , , pageHeight] = page.view;
    const canvas = canvasRef.current;
    const scale = parentRef ? parentRef.current.clientHeight / pageHeight : 1;
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport,
    };
    page.render(renderContext);
  }, [page, parentRef]);

  return <canvas ref={canvasRef} />;
}
