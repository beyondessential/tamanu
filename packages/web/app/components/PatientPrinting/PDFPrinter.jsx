import React, { memo, useRef } from 'react';
import { usePDF } from '@react-pdf/renderer';

const PDFIframe = memo(({ id, children }) => {
  const iframeRef = useRef(null);
  const [instance] = usePDF({ document: children });

  if (!instance.url) return null;

  const onLoad = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <iframe
      ref={iframeRef}
      src={`${instance?.url}#toolbar=0`}
      title={id}
      id={id}
      key={id}
      style={{ display: 'none' }}
      onLoad={onLoad}
    />
  );
});

export const PDFPrinter = memo(({ id, children, isLoading = false }) => {
  if (isLoading) return null;
  return <PDFIframe id={id}>{children}</PDFIframe>;
});
