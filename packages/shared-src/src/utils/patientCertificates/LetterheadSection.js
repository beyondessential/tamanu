import React from 'react';
import { Logo, LetterHead, CertificateLogo } from './Layout';
import { CertificateAddress, CertificateTitle } from './Typography';

export const LetterheadSection = ({ getLocalisation, logoSrc, certificateTitle }) => {
  const title = getLocalisation('templates.letterhead.title');
  const subTitle = getLocalisation('templates.letterhead.subTitle');
  return (
    <>
      {logoSrc && <CertificateLogo logoSrc={logoSrc} />}
      <LetterHead>
        <CertificateAddress>{title}</CertificateAddress>
        <CertificateAddress>{subTitle}</CertificateAddress>
      </LetterHead>

      <CertificateTitle>{certificateTitle}</CertificateTitle>
    </>
  );
};
