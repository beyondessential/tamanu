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
});

export const H1 = props => <Text style={styles.h1} {...props} />;
export const H2 = props => <Text style={styles.h2} {...props} />;
export const H3 = props => <Text style={styles.h3} {...props} />;
export const P = ({ mt = 0, mb, ...props }) => (
  <Text {...props} style={[styles.p, { marginTop: mt, marginBottom: mb }]} />
);
