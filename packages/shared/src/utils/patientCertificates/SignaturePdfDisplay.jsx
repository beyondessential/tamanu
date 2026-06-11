import { Path, StyleSheet, Svg } from '@react-pdf/renderer';
import React from 'react';

import {
  bodyToDrawPaths,
  SIGNATURE_VIEWBOX,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
} from '../signature';

const SIGNATURE_PDF_WIDTH = 198;
const SIGNATURE_PDF_HEIGHT =
  (SIGNATURE_VIEWBOX_HEIGHT / SIGNATURE_VIEWBOX_WIDTH) * SIGNATURE_PDF_WIDTH;

const styles = StyleSheet.create({
  svg: {
    border: '0.25pt solid black',
    borderRadius: 3,
    height: SIGNATURE_PDF_HEIGHT,
    width: SIGNATURE_PDF_WIDTH,
  },
});

export const SignaturePdfDisplay = ({ body }) => {
  const paths = bodyToDrawPaths(body).filter(Boolean);
  if (!paths.length) return null;

  return (
    <Svg viewBox={SIGNATURE_VIEWBOX} style={styles.svg}>
      {paths.map((d, index) => (
        <Path key={index} d={d} fill="currentColor" fillRule="nonzero" />
      ))}
    </Svg>
  );
};
