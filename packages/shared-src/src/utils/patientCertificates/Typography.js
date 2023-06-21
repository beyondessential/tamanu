import React from 'react';
import { StyleSheet, Text } from '@react-pdf/renderer';

const styles = StyleSheet.create({
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
    color: '#444444',
    marginBottom: 14,
  },
});

export const H1 = ({ style, ...props }) => <Text style={{ ...styles.h1, ...style }} {...props} />;
export const H2 = ({ style, ...props }) => <Text style={{ ...styles.h2, ...style }} {...props} />;
export const H3 = ({ style, ...props }) => <Text style={{ ...styles.h3, ...style }} {...props} />;
export const P = ({ mt = 0, mb, bold = false, style = {}, ...props }) => (
  <Text
    {...props}
    style={[
      styles.p,
      { marginTop: mt, marginBottom: mb },
      ...(bold ? [{ fontFamily: 'Helvetica-Bold' }] : []),
      style,
    ]}
  />
);
export const CertificateAddress = props => <Text style={styles.certificateAddress} {...props} />;
export const CertificateTitle = props => <Text style={styles.certificateTitle} {...props} />;
