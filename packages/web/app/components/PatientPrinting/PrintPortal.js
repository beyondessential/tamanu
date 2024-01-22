import React, { useEffect } from 'react';
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
