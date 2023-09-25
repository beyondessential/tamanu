import React from 'react';
import { Box, Logo } from './Layout';
import { H1, H2 } from './Typography';

export const CovidLetterheadSection = ({ getSetting, logoSrc }) => {
  const title = getSetting('templates.letterhead.title');
  const subTitle = getSetting('templates.letterhead.subTitle');
  return (
    <>
      {logoSrc && <Logo logoSrc={logoSrc} />}
      <Box
        style={{
          maxWidth: 400,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <H1>{title}</H1>
        <H2>{subTitle}</H2>
      </Box>
    </>
  );
};
