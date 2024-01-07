import React from 'react';
import { Image, View } from '@react-pdf/renderer';
import JsBarcode from 'jsbarcode';
import { P } from '../Typography';

export const PrintableBarcode = ({
  patient,
  width,
  height,
  margin = '1rem',
  barWidth = 1,
  barHeight = 35,
}) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, patient.displayId, {width: 1, height: 45, fontSize: 11});
  const barcode = canvas.toDataURL();

  return (
    <View style={{flexDirection: "row"}}>
      <P style={{ marginVertical: 3 }} bold>
        Patient ID barcode:
      </P>
      <Image source={barcode} style={{width: 105}}/>
    </View>
  );
};
