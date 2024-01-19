import React from 'react';
import { Image } from '@react-pdf/renderer';
import JsBarcode from 'jsbarcode';

export const PrintableBarcode = ({
  id,
  width = 124,
  barWidth = 1,
  barHeight = 45,
  fontSize = 13,
}) => {
  // eslint-disable-next-line no-undef
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, id, { width: barWidth, height: barHeight, fontSize: fontSize });
  const barcode = canvas.toDataURL();

  return <Image source={barcode} style={{ width: width }} />;
};
