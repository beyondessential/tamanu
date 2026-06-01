import React from 'react';
import styled from 'styled-components';
import {
  SIGNATURE_VIEWBOX,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
} from '../utils/signaturePath';

const Svg = styled.svg.attrs({
  'data-testid': 'signaturepathdisplay',
  preserveAspectRatio: 'xMidYMid meet',
  viewBox: SIGNATURE_VIEWBOX,
})`
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  color: ${p => p.theme.palette.text.primary};
  display: block;
  height: auto;
  max-width: min(${SIGNATURE_VIEWBOX_WIDTH}px, 100%);
  width: 100%;
`;

export const SignaturePathDisplay = ({ path, ...props }) => {
  if (!path) return null;

  return (
    <Svg {...props}>
      <path d={path} fill="currentColor" />
    </Svg>
  );
};
