import React, { useEffect, useRef } from 'react';

export function PDFPage({ page }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!page) {
      return;
    }
    const viewport = page.getViewport({ scale: 1 });
    const canvas = canvasRef.current;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport,
    };
    page.render(renderContext);
  }, [page]);

  return <canvas ref={canvasRef} />;
}
