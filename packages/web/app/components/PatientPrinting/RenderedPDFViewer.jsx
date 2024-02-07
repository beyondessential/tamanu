import React, { useDeferredValue } from 'react';
import { useRenderPDF } from '../../utils/useRenderPDF';

const FullIframe = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: 50vh;
`;
export const RenderedPDFViewer = ({
  style,
  className,
  text: outerText,
  innerRef,
  showToolbar = true,
  pdfProps,
  ...props
}) => {
  const text = useDeferredValue(outerText);
  const { url, loading, error } = useRenderPDF(pdfProps);

  const src = url ? `${url}#toolbar=${showToolbar ? 1 : 0}` : null;
  if (loading)
    return (
      <div className={className} style={style}>
        Loading...
      </div>
    );

  if (error) {
    console.log({ error });
    return (
      <div className={className} style={style}>
        {JSON.stringify(error)}
      </div>
    );
  }

  return <FullIframe src={src} ref={innerRef} style={style} className={className} {...props} />;
};
