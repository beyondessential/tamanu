import React from 'react';
import { Text } from '@react-pdf/renderer';
import { CustomStyleSheet } from '../renderPdf';

const styles = CustomStyleSheet.create({
  h1: {
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 700,
  },
  h2: {
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 30,
    fontWeight: 500,
  },
  h3: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 500,
  },
  p: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    fontWeight: 400,
    marginBottom: 15,
  },
  certificateAddress: {
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 13,
  },
  certificateTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 14,
  },
  fontBold: {
    fontFamily: 'Helvetica-Bold',
  },
});

export const H1 = ({ style, language, ...props }) => (
  <Text style={{ ...styles(language).h1, ...style }} {...props} />
);
export const H2 = ({ style, language, ...props }) => (
  <Text style={{ ...styles(language).h2, ...style }} {...props} />
);
export const H3 = ({ style, language, ...props }) => (
  <Text style={{ ...styles(language).h3, ...style }} {...props} />
);
export const P = ({ mt = 0, mb, bold = false, fontSize = 14, style = {}, language, ...props }) => (
  <Text
    {...props}
    style={[
      styles(language).p,
      { marginTop: mt, marginBottom: mb, fontSize },
      ...(bold ? [styles(language, true).fontBold] : []),
      style,
    ]}
  />
);
export const CertificateAddress = ({ language, ...props }) => (
  <Text style={styles(language).certificateAddress} {...props} />
);
export const CertificateTitle = ({ language, ...props }) => (
  <Text style={styles(language).certificateTitle} {...props} />
);
