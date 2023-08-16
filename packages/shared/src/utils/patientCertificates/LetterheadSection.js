import React from 'react';
import { CertificateLogo } from './Layout';
import { CertificateAddress, CertificateTitle } from './Typography';

export const LetterheadSection = ({
  getLocalisation,
  logoSrc,
  certificateTitle,
  overrideLetterhead,
}) => {
  const title = overrideLetterhead?.title ?? getLocalisation('templates.letterhead.title');
  const subTitle = overrideLetterhead?.subTitle ?? getLocalisation('templates.letterhead.subTitle');
  return (
    <>
      {logoSrc && <CertificateLogo logoSrc={logoSrc} />}
      <CertificateAddress>{`${title}\n${subTitle}`}</CertificateAddress>
      <CertificateTitle>{certificateTitle}</CertificateTitle>
    </>
  );
};
