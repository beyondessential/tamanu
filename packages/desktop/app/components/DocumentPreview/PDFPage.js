import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const WIDTH_MAX = 0.9;

const Page = styled.canvas`
  margin-bottom: 20px;
`;

export function PDFPage({ page, parentRef }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!page) {
      return;
    }
    const [, , pageWidth, pageHeight] = page.view;
    const canvas = canvasRef.current;
    let widthScale = 1;
    let heightScale = 1;
    if (parentRef?.current) {
      widthScale = (parentRef.current.clientWidth / pageWidth) * WIDTH_MAX;
      heightScale = parentRef.current.clientHeight / pageHeight;
    }
    const scale = Math.min(widthScale, heightScale);
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport,
    };
    page.render(renderContext);
  }, [page, parentRef]);

  return <Page ref={canvasRef} />;
}
