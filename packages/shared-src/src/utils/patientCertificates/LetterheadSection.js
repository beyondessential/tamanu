import React from 'react';
import { Box, Logo } from './Layout';
import { H1, H2 } from './Typography';

export const LetterheadSection = ({ getLocalisation, logoSrc, title, subTitle }) => (
  <>
    {logoSrc && <Logo logoSrc={logoSrc} />}
    <Box
      style={{
        maxWidth: 400,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <H1>{title || getLocalisation('templates.letterhead.title')}</H1>
      <H2>{subTitle || getLocalisation('templates.letterhead.subTitle')}</H2>
    </Box>
  </>
);
