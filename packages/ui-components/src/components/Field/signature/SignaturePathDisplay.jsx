import React from 'react';
import styled from 'styled-components';

import {
  bodyToDrawPaths,
  SIGNATURE_VIEWBOX,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
} from '@tamanu/shared/utils/signature';

export const SignatureSvg = styled.svg.attrs({
  preserveAspectRatio: 'xMidYMid meet',
  viewBox: SIGNATURE_VIEWBOX,
})`
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  color: ${p => p.theme.palette.text.primary};
  display: block;
  height: auto;
  width: clamp(10rem, 100%, ${SIGNATURE_VIEWBOX_WIDTH}px);
  &,
  & path {
    fill: currentColor;
  }
`;

export function SignaturePathDisplay({ path, ...props }) {
  const displayPaths = bodyToDrawPaths(path);

  return (
    <SignatureSvg data-testid="signaturepathdisplay" {...props}>
      {displayPaths.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </SignatureSvg>
  );
}
