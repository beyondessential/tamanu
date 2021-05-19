import React from 'react';
import styled from 'styled-components';

import Barcode from 'react-barcode';

const BarcodeFrame = styled.div`
  width: ${p => p.width};
  height: ${p => p.height};
  margin-right: 1rem;
  overflow: hidden;
`;

export const PatientBarcode = ({ patient, width, height }) => (
  <BarcodeFrame width={width} height={height}>
    <Barcode value={patient.displayId} width={1} height={35} margin={0} />
  </BarcodeFrame>
);
