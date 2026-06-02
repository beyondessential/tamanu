import React from 'react';
import styled from 'styled-components';
import {
  bodyToDisplayPath,
  SIGNATURE_VIEWBOX,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
} from './pathUtils';

export const SignatureSvg = styled.svg.attrs({
  preserveAspectRatio: 'xMidYMid meet',
  viewBox: SIGNATURE_VIEWBOX,
})`
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  color: ${p => p.theme.palette.text.primary};
  display: block;
  height: auto;
  width: min(100%, ${SIGNATURE_VIEWBOX_WIDTH}px);
  &,
  & path {
    fill: currentColor;
  }
`;

export function SignaturePathDisplay({ path, ...props }) {
  const displayPath = bodyToDisplayPath(path);

  return (
    <SignatureSvg data-testid="signaturepathdisplay" {...props}>
      {displayPath && <path d={displayPath} />}
    </SignatureSvg>
  );
}
