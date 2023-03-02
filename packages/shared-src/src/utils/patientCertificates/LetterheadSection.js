import React from 'react';
import { Logo, LetterHead } from './Layout';
import { H3, RightAligned } from './Typography';

export const LetterheadSection = ({ getLocalisation, logoSrc, certificateTitle }) => {
  const title = getLocalisation('templates.letterhead.title');
  const subTitle = getLocalisation('templates.letterhead.subTitle');
  return (
    <>
      {logoSrc && <Logo logoSrc={logoSrc} />}
      <LetterHead>
        <H3>{subTitle}</H3>
        <H3>{title}</H3>
      </LetterHead>
      <H3>
        <RightAligned>{certificateTitle}</RightAligned>
      </H3>
    </>
  );
};
