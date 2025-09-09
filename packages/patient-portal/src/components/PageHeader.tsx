import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Drawer, IconButton, Divider, Box, Button, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { styled } from '@mui/material/styles';

import tamanuLogoBlue from '../assets/images/tamanu_logo_blue.svg';
import { useCurrentUser } from '@routes/PrivateRoute';

const HeaderContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  width: 320,
  maxWidth: '100%',
}));

const PatientName = styled(Typography)(() => ({
  fontSize: 18,
  fontWeight: 500,
}));

const LogoutButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  width: 320,
  maxWidth: '100%',
}));

export const PageHeader = () => {
  const [open, setOpen] = useState(true);
  const { firstName, lastName } = useCurrentUser();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <HeaderContainer>
      <img src={tamanuLogoBlue} alt="Tamanu Logo" />
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="end"
        onClick={handleDrawerOpen}
        sx={[open && { display: 'none' }]}
      >
        <MenuIcon />
      </IconButton>
      <Drawer open={open} onClose={handleDrawerClose} anchor="right" sx={{ padding: 10 }}>
        <DrawerHeader>
          <PatientName>
            {firstName} {lastName}
          </PatientName>
          <IconButton onClick={handleDrawerClose}>
            <CloseIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <Box>
          <LogoutButton
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none' }}
            startIcon={<LogoutIcon />}
          >
            Log out
          </LogoutButton>
        </Box>
      </Drawer>
    </HeaderContainer>
  );
};
