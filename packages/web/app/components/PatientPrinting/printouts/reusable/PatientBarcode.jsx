import React from 'react';
import styled from 'styled-components';
import Barcode from 'react-barcode';

const BarcodeFrame = styled.div`
  width: ${p => p.width};
  height: ${p => p.height};
  margin-right: ${p => p.margin};
  overflow: hidden;
`;

export const PatientBarcode = ({
  patient,
  width,
  height,
  margin = '1rem',
  barWidth = 1,
  barHeight = 35,
}) => (
  <BarcodeFrame width={width} height={height} margin={margin}>
    <Barcode value={patient.displayId} width={barWidth} height={barHeight} margin={0} />
  </BarcodeFrame>
);
