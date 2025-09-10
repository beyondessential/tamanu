import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useCurrentUser } from '@routes/PrivateRoute';
import { MainMenu } from './MainMenu';
import tamanuLogoBlue from '../../assets/images/tamanu_logo_blue.svg';

const HeaderContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '10px 20px 10px 20px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
}));

export const PageHeader = () => {
  const [open, setOpen] = useState(false);
  const { firstName, lastName } = useCurrentUser();

  const onOpen = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const userName = `${firstName} ${lastName}`;

  return (
    <HeaderContainer>
      <img src={tamanuLogoBlue} alt="Tamanu Logo" />
      <IconButton aria-label="open drawer" edge="end" onClick={onOpen} color="primary">
        <MenuIcon />
      </IconButton>
      <MainMenu open={open} userName={userName} onClose={onClose} />
    </HeaderContainer>
  );
};
