import React from 'react';
import { Image, Text, View } from '@react-pdf/renderer';
import { CustomStyleSheet } from '../renderPdf';

const certificateMargins = '0 18px';

export const styles = CustomStyleSheet.create({
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
    fontWeight: 400,
    width: 100,
  },
  line: {
    width: 300,
    borderBottomColor: 'black',
    borderBottomStyle: 'solid',
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
    maxHeight: '100vh',
    maxWidth: '100vw',
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
    height: 60,
    width: 120,
    objectFit: 'contain',
    objectPosition: 'top left',
  },
  certificateHeader: {
    margin: 0,
  },
  certificateFooter: {
    margin: certificateMargins,
  },
  certificateContent: {
    margin: certificateMargins,
  },
  fixedHeader: {
    position: 'absolute',
    top: 25,
    right: 50,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 16,
    left: 50,
    right: 50,
    textAlign: 'left',
  },
  pageBreakPadding: {
    height: 26,
    width: '100%',
  },
  lightDivider: {
    borderTop: '0.5 solid #000000',
    marginTop: 10,
    marginBottom: 10,
  },
});

export const Row = ({ language, ...props }) => <View style={styles(language).row} {...props} />;
export const Col = ({ language, ...props }) => <View style={styles(language).col} {...props} />;
export const Box = ({ mt, mb, ...props }) => (
  <View style={[styles().box, { marginTop: mt, marginBottom: mb }]} {...props} />
);

export const Signature = ({ text, fontSize = 12, lineThickness = 1, language }) => (
  <View style={styles(language).signature}>
    <Text style={{ ...styles(language).signatureText, fontSize: fontSize }}>{text}:</Text>
    <View style={{ ...styles(language).line, borderBottomWidth: lineThickness }} />
  </View>
);

export const SigningImage = ({ src }) => (
  <Image src={src} style={styles().signingImage} cache={false} />
);

export const Watermark = ({ src }) => (
  <View style={styles().watermarkContainer}>
    <Image src={src} style={styles().watermarkImage} cache={false} />
  </View>
);

/* react-pdf doesn't yet support svg images in the Image component so this will need to be either a
png or jpg src image
@see https://github.com/diegomura/react-pdf/issues/1250 */
export const Logo = ({ logoSrc }) => <Image src={logoSrc} style={styles().logo} cache={false} />;

export const VDSImage = ({ src }) => <Image src={src} style={styles().vds} />;

export const CertificateLogo = ({ logoSrc, language }) => (
  <Image src={logoSrc} style={styles(language).certificateLogo} cache={false} />
);

export const CertificateHeader = ({ language, ...props }) => (
  <View style={styles(language).certificateHeader} {...props} />
);
export const CertificateFooter = props => <View style={styles().certificateFooter} {...props} />;
export const LightDivider = props => <View style={styles().lightDivider} {...props} />;
export const CertificateContent = props => <View style={styles().certificateContent} {...props} />;

export const FixedHeader = ({ children, props }) => (
  <View fixed style={styles().fixedHeader} {...props}>
    {children}
  </View>
);

export const FixedFooter = ({ children, props }) => (
  <View fixed style={styles().fixedFooter} {...props}>
    <View style={{ ...styles().lightDivider, borderTopColor: '#888888' }} />
    {children}
  </View>
);

export const PageBreakPadding = ({ size }) => (
  <View
    fixed
    style={{ ...styles().pageBreakPadding, height: size || styles().pageBreakPadding.height }}
  />
);
