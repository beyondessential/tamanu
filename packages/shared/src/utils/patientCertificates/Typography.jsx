import React from 'react';
import { StyleSheet } from '@react-pdf/renderer';
import { Text } from '../pdf/Text';

const styles = StyleSheet.create({
  h1: {
    fontFamily: 'Rubik',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  h2: {
    fontFamily: 'Rubik',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 30,
    fontFamily: 'Rubik-Bold',
  },
  h3: {
    fontFamily: 'Rubik',
    marginBottom: 20,
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
  },
  p: {
    fontFamily: 'Rubik',
    fontSize: 12,
    fontFamily: 'Rubik',
    marginBottom: 15,
  },
  certificateAddress: {
    fontFamily: 'Rubik',
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 13,
    fontFamily: 'Rubik-Bold',
  },
  certificateTitle: {
    fontFamily: 'Rubik',
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 14,
    fontFamily: 'Rubik-Bold',
  },
  certificateSubtitle: {
    fontFamily: 'Rubik',
    fontSize: 18,
    textAlign: 'right',
    marginTop: '-10px',
    height: 40,
  },
});

export const H1 = ({ style, ...props }) => <Text style={{ ...styles.h1, ...style }} {...props} />;
export const H2 = ({ style, ...props }) => <Text style={{ ...styles.h2, ...style }} {...props} />;
export const H3 = ({ style, ...props }) => <Text style={{ ...styles.h3, ...style }} {...props} />;
export const P = ({ mt = 0, mb, bold = false, fontSize = 14, style = {}, ...props }) => (
  <Text
    {...props}
    style={[styles.p, { marginTop: mt, marginBottom: mb, fontSize }, style]}
    bold={bold}
  />
);
export const CertificateAddress = props => <Text style={styles.certificateAddress} {...props} />;
export const CertificateTitle = props => <Text style={styles.certificateTitle} {...props} />;
export const CertificateSubtitle = props => <Text style={styles.certificateSubtitle} {...props} />;
