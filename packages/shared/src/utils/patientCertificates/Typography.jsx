import React from 'react';
import { StyleSheet } from '@react-pdf/renderer';
import { Text } from '../pdf/Text';

const styles = StyleSheet.create({
  h1: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 700,
  },
  h2: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 30,
    fontWeight: 700,
  },
  h3: {
    marginBottom: 20,
    fontSize: 14,
  },
  p: {
    fontSize: 12,
    fontWeight: 400,
    marginBottom: 15,
  },
  certificateAddress: {
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 13,
    fontWeight: 700,
  },
  certificateTitle: {
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 14,
  },
  certificateSubtitle: {
    fontWeight: 700,
    fontSize: 18,
    textAlign: 'right',
    marginTop: '-10px',
    height: 40,
  },
});

export const H1 = ({ style, ...props }) => (
  <Text bold style={{ ...styles.h1, ...style }} {...props} />
);
export const H2 = ({ style, ...props }) => (
  <Text bold style={{ ...styles.h2, ...style }} {...props} />
);
export const H3 = ({ style, ...props }) => (
  <Text bold style={{ ...styles.h3, ...style }} {...props} />
);
export const P = ({ mt = 0, mb, bold = false, fontSize = 14, style = {}, ...props }) => (
  <Text
    {...props}
    style={[styles.p, { marginTop: mt, marginBottom: mb, fontSize }, style]}
    bold={bold}
  />
);
export const CertificateAddress = props => (
  <Text bold style={styles.certificateAddress} {...props} />
);
export const CertificateTitle = props => <Text bold style={styles.certificateTitle} {...props} />;
export const CertificateSubtitle = props => <Text style={styles.certificateSubtitle} {...props} />;
