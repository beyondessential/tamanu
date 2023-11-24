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
    fontFamily: 'Helvetica-Bold',
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
    width: 140,
  },
  certificateLogo: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 'auto',
    width: 66,
  },
  certificateHeader: {
    margin: '0 18px',
  },
  certificateFooter: {
    margin: '0 18px',
  },
  divider: {
    borderTop: '0.5 solid #000000',
    marginTop: 10,
    marginBottom: 10,
  },
  documentFooter: {
    position: 'absolute',
    bottom: 16,
    left: 50,
    right: 50,
    textAlign: 'left',
    fontSize: 8,
    fontWeight: 600,
    marginTop: 31,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerRight: {
    flex: 1,
    textAlign: 'right',
  },
  documentFooterLabelText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica-Bold',
  },
  documentFooterValueText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica',
  },
  documentHeader: {
    position: 'absolute',
    top: 25,
    right: 50,
  },
  documentHeaderContent: {
    flexDirection: 'row',
  },
  documentHeaderLabelText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica-Bold',
  },
  documentHeaderValueText: {
    fontSize: 8,
    fontWeight: 400,
    fontFamily: 'Helvetica',
  },
});

export const Row = props => <View style={styles.row} {...props} />;
export const Col = props => <View style={styles.col} {...props} />;
export const Box = ({ mt, mb, ...props }) => (
  <View style={[styles.box, { marginTop: mt, marginBottom: mb }]} {...props} />
);

export const Signature = ({ text }) => (
  <View style={styles.signature}>
    <Text style={styles.signatureText}>{text}:</Text>
    <View style={styles.line} />
  </View>
);

export const SigningImage = ({ src }) => (
  <Image src={src} style={styles.signingImage} cache={false} />
);

export const Watermark = ({ src }) => (
  <View style={styles.watermarkContainer}>
    <Image src={src} style={styles.watermarkImage} cache={false} />
  </View>
);

/* react-pdf doesn't yet support svg images in the Image component so this will need to be either a
png or jpg src image
@see https://github.com/diegomura/react-pdf/issues/1250 */
export const Logo = ({ logoSrc }) => <Image src={logoSrc} style={styles.logo} cache={false} />;

export const VDSImage = ({ src }) => <Image src={src} style={styles.vds} />;

export const CertificateLogo = ({ logoSrc }) => (
  <Image src={logoSrc} style={styles.certificateLogo} cache={false} />
);

export const CertificateHeader = props => <View style={styles.certificateHeader} {...props} />;
export const CertificateFooter = props => <View style={styles.certificateFooter} {...props} />;

export const Divider = props => <View style={styles.divider} {...props} />;

export const DocumentFooter = ({ printDate, printFacility, printedBy }) => (
  <View style={styles.documentFooter} fixed>
    <Divider />
    <View style={styles.footerContent}>
      <View style={styles.footerLeft}>
        <Text style={styles.documentFooterLabelText}>Print date: </Text>
        <Text style={styles.documentFooterValueText}>{printDate} | </Text>
        <Text style={styles.documentFooterLabelText}>Printing facility: </Text>
        <Text style={styles.documentFooterValueText}>{printFacility} | </Text>
        <Text style={styles.documentFooterLabelText}>Printed by: </Text>
        <Text style={styles.documentFooterValueText}>{printedBy}</Text>
      </View>
      <View style={styles.footerRight}>
        <Text
          style={styles.documentFooterValueText}
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  </View>
);

const DocumentHeaderContent = ({ patientName, patientId }) => (
  <View style={styles.documentHeaderContent}>
    <Text style={styles.documentHeaderLabelText}>Immunisation Certificate | </Text>
    <Text style={styles.documentHeaderLabelText}>Patient name: </Text>
    <Text style={styles.documentHeaderValueText}>{patientName} | </Text>
    <Text style={styles.documentHeaderLabelText}>Patient ID: </Text>
    <Text style={styles.documentHeaderValueText}>{patientId}</Text>
  </View>
);

export const DocumentHeader = ({ patientName, patientId }) => {
  return (
    <View
      style={styles.documentHeader}
      fixed
      render={({ pageNumber }) =>
        pageNumber > 1 && DocumentHeaderContent({ patientName, patientId })
      }
    />
  );
};
