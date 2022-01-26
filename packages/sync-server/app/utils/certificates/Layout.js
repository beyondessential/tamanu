import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

export const styles = StyleSheet.create({
  page: {
    position: 'relative',
    fontFamily: 'Roboto',
    padding: 10,
    color: '#333333',
  },
  logo: {
    position: 'absolute',
    top: 35,
    left: 25,
    width: 70,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  col: {
    width: '50%',
  },
  box: {
    marginBottom: 30,
  },
  signature: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  signatureText: {
    fontSize: 12,
    fontWeight: 400,
    width: 100,
  },
  line: {
    width: 300,
    borderBottom: '1 solid black',
  },
  signingImage: {
    width: '100%',
  },
  watermarkContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    minWidth: '100%',
    minHeight: '100%',
    backgroundColor: '#aaaaaa',
    opacity: 0.05,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkImage: {
    objectFit: 'contain',
  },
});

export const Row = props => <View {...props} style={styles.row} />;
export const Col = props => <View {...props} style={styles.col} />;
export const Box = ({ mt, mb, ...props }) => (
  <View {...props} style={[styles.box, { marginTop: mt, marginBottom: mb }]} />
);

export const Signature = ({ text }) => (
  <View style={styles.signature}>
    <Text style={styles.signatureText}>{text}:</Text>
    <View style={styles.line} />
  </View>
);

export const SigningImage = ({ data }) => {
  return <Image src={{ data, format: 'png' }} style={styles.signingImage} />;
};

export const Watermark = ({ data }) => {
  return (
    <View style={styles.watermarkContainer}>
      <Image src={{ data, format: 'png' }} style={styles.watermarkImage} />
    </View>
  );
};
