import React from 'react';
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    position: 'relative',
    padding: '30 30 0 30',
    color: '#222222',
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  vds: {
    position: 'relative',
    top: -30,
    left: -30,
    width: 140,
  },
});

export const Row = props => <View {...props} style={styles.row} />;
export const Col = props => <View style={styles.col} {...props} />;
export const Box = ({ mt, mb, ...props }) => (
  <View {...props} style={[styles.box, { marginTop: mt, marginBottom: mb }]} />
);

export const Signature = ({ text }) => (
  <View style={styles.signature}>
    <Text style={styles.signatureText}>{text}:</Text>
    <View style={styles.line} />
  </View>
);

export const SigningImage = ({ src }) => {
  return <Image src={src} style={styles.signingImage} cache={false} />;
};

export const Watermark = ({ src }) => {
  return (
    <View style={styles.watermarkContainer}>
      <Image src={src} style={styles.watermarkImage} cache={false} />
    </View>
  );
};

export const VDSImage = ({ src }) => {
  return <Image src={src} style={styles.vds} />;
};
