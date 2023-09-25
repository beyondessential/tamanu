import React from 'react';
import { CertificateLogo } from './Layout';
import { CertificateAddress, CertificateTitle } from './Typography';

export const LetterheadSection = ({ getSetting, logoSrc, certificateTitle, letterheadConfig }) => {
  // Give priority to letterheadConfig which is extracted from settings
  const title = letterheadConfig?.title ?? getSetting('templates.letterhead.title');
  const subTitle = letterheadConfig?.subTitle ?? getSetting('templates.letterhead.subTitle');
  return (
    <>
      {logoSrc && <CertificateLogo logoSrc={logoSrc} />}
      <CertificateAddress>{`${title}\n${subTitle}`}</CertificateAddress>
      <CertificateTitle>{certificateTitle}</CertificateTitle>
    </>
  );
};
