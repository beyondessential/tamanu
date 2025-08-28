import React from 'react';
import { Box } from '@mui/material';

import tamanuLogoBlue from '../assets/images/tamanu_logo_blue.svg';

export const PageHeader = () => {
  return (
    <Box
      sx={theme => ({
        backgroundColor: 'background.paper',
        p: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <img src={tamanuLogoBlue} alt="Tamanu Logo" />
    </Box>
  );
};
