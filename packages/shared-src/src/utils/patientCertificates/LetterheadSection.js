import React from 'react';
import { Logo } from './Logo';
import { Box, styles } from './Layout';
import { H1, H2 } from './Typography';

export const LetterheadSection = ({ getLocalisation }) => {
  const title = getLocalisation('templates.letterhead.title');
  const subTitle = getLocalisation('templates.letterhead.subTitle');
  return (
    <>
      <Logo style={styles.logo} />
      <Box>
        <H1>{title}</H1>
        <H2>{subTitle}</H2>
      </Box>
    </>
  );
};
