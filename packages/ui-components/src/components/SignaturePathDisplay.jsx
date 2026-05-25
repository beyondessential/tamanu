import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '../constants/colors';
import { SIGNATURE_VIEWBOX_HEIGHT, SIGNATURE_VIEWBOX_WIDTH } from '../utils/signaturePath';

const DisplaySvg = styled.svg`
  display: block;
  max-width: ${SIGNATURE_VIEWBOX_WIDTH}px;
  width: 100%;
  height: auto;
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
`;

export const SignaturePathDisplay = ({ path, 'data-testid': dataTestId = 'signaturepathdisplay' }) => {
  if (!path) {
    return null;
  }

  return (
    <DisplaySvg
      viewBox={`0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      data-testid={dataTestId}
    >
      <path d={path} fill={TAMANU_COLORS.darkestText} />
    </DisplaySvg>
  );
};
