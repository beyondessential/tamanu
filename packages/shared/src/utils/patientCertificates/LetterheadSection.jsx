import React from 'react';
import { CertificateLogo } from './Layout';
import { CertificateAddress, CertificateTitle, CertificateSubtitle } from './Typography';

export const LetterheadSection = ({ logoSrc, certificateTitle, certificateSubtitle, letterheadConfig }) => {
  const { title, subTitle } = letterheadConfig;
  return (
    <>
      {logoSrc && <CertificateLogo logoSrc={logoSrc} />}
      <CertificateAddress>{`${title}\n${subTitle}`}</CertificateAddress>
      <CertificateTitle>{certificateTitle}</CertificateTitle>
      {certificateSubtitle && <CertificateSubtitle>{certificateSubtitle}</CertificateSubtitle>}
    </>
  );
};
