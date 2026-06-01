import React from 'react';
import styled from 'styled-components';
import {
  SIGNATURE_VIEWBOX,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
} from '../utils/signaturePath';

const SignatureSvg = styled.svg.attrs({
  preserveAspectRatio: 'xMidYMid meet',
  viewBox: SIGNATURE_VIEWBOX,
})`
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  color: ${p => p.theme.palette.text.primary};
  display: block;
  height: auto;
  max-width: min(${SIGNATURE_VIEWBOX_WIDTH}px, 100%);
  width: 100%;
  &,
  & path {
    fill: currentColor;
  }
`;

export const SignaturePathDisplay = ({ path, ...props }) => {
  if (!path) return null;

  return (
    <SignatureSvg data-testid="signaturepathdisplay" {...props}>
      <path d={path} />
    </SignatureSvg>
  );
};
