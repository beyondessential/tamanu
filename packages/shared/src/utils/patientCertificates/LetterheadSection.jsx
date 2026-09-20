import React from 'react';
import { StyleSheet, View } from '@react-pdf/renderer';
import { CertificateLogo, styles as layoutStyles } from './Layout';
import { CertificateAddress, CertificateTitle, CertificateSubtitle } from './Typography';

const LOGO_GUTTER = 10;

const styles = StyleSheet.create({
  clearOfLogo: {
    paddingLeft: layoutStyles.certificateLogo.width + LOGO_GUTTER,
  },
});

export const LetterheadSection = ({ logoSrc, certificateTitle, certificateSubtitle, letterheadConfig }) => {
  const { title, subTitle } = letterheadConfig;
  return (
    <>
      {logoSrc && <CertificateLogo logoSrc={logoSrc} />}
      <View style={logoSrc ? styles.clearOfLogo : undefined}>
        <CertificateAddress>{`${title}\n${subTitle}`}</CertificateAddress>
      </View>
      <CertificateTitle>{certificateTitle}</CertificateTitle>
      {certificateSubtitle && <CertificateSubtitle>{certificateSubtitle}</CertificateSubtitle>}
    </>
  );
};
