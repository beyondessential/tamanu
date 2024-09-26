import React from 'react';
import { CertificateLogo } from './Layout';
import { CertificateAddress, CertificateTitle } from './Typography';

export const LetterheadSection = ({ logoSrc, certificateTitle, letterheadConfig }) => {
  const { title, subTitle } = letterheadConfig;
  return (
    <>
      {logoSrc && <CertificateLogo logoSrc={logoSrc} />}
      <CertificateAddress>{`${title}\n${subTitle}`}</CertificateAddress>
      <CertificateTitle>{certificateTitle}</CertificateTitle>
    </>
  );
};
