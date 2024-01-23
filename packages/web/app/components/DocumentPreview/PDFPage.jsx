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
    const [, , pageWidth] = page.view;
    const canvas = canvasRef.current;
    let scale = 1;
    if (parentRef?.current) {
      scale = (parentRef.current.clientWidth / pageWidth) * WIDTH_MAX;
    }
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
