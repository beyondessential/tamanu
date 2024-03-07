import React from 'react';
import { CertificateLogo } from './Layout';
import { CertificateAddress, CertificateTitle } from './Typography';

export const LetterheadSection = ({
  getLocalisation,
  logoSrc,
  certificateTitle,
  letterheadConfig,
  language
}) => {
  // Give priority to letterheadConfig which is extracted from settings
  const title = letterheadConfig?.title ?? getLocalisation('templates.letterhead.title');
  const subTitle = letterheadConfig?.subTitle ?? getLocalisation('templates.letterhead.subTitle');
  return (
    <>
      {logoSrc && <CertificateLogo logoSrc={logoSrc} language={language} />}
      <CertificateAddress language={language}>{`${title}\n${subTitle}`}</CertificateAddress>
      <CertificateTitle language={language}>{certificateTitle}</CertificateTitle>
    </>
  );
};
