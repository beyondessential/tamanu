import React from 'react';
import { Box, Logo } from './Layout';
import { H1, H2 } from './Typography';

export const CovidLetterheadSection = ({ getSetting, logoSrc }) => {
  // TODO: maybe make this the same as LetterheadSection for consistency
  const { title, subTitle } = getSetting('templates.letterhead');
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
