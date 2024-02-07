import React, { useDeferredValue } from 'react';
import { useRenderPDF } from '../../utils/useRenderPDF';

export const RenderedPDFViewer = ({
  style,
  className,
  text: outerText,
  innerRef,
  showToolbar = true,
  ...props
}) => {
  const text = useDeferredValue(outerText);
  const { url, loading, error } = useRenderPDF({ text });

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

  return (
    <iframe
      // @ts-ignore
      src={src}
      ref={innerRef}
      // @ts-ignore
      style={style}
      className={className}
      {...props}
    />
  );
};
