import React, { useEffect } from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

export const PrintPortal = React.memo(({ children }) => {
  const el = document.createElement('div');

  useEffect(() => {
    const root = document.querySelector('#print-root');
    root.appendChild(el);
    return () => {
      root.removeChild(el);
    };
  });

  return createPortal(children, el);
});

export const LetterPage = styled.div`
  background: white;
  width: 8.5in;
  height: 11in;
`;
