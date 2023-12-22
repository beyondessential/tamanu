import React from 'react';
import styled from 'styled-components';
import Barcode from 'react-barcode';
import { Image } from '@react-pdf/renderer';

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
}) => {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(
    <Barcode value={patient.displayId} width={barWidth} height={barHeight} margin={0} />,
  );
  const img_src = 'data:image/svg+xml;base64,' + window.btoa(svgString);

  return <Image source={img_src} />;
};
