import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Drawer, IconButton, Button, Box, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { styled } from '@mui/material/styles';
import { useLogout } from '@api/mutations';

const StyledDrawer = styled(Drawer)(() => ({
  '& .MuiPaper-root': {
    padding: '10px 15px',
    width: 320,
    maxWidth: '100%',
  },
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  marginBottom: 3,
}));

const PatientName = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 500,
}));

interface MainMenuProps {
  open: boolean;
  onClose: () => void;
  userName: string;
}

export const MainMenu = ({ open, onClose, userName }: MainMenuProps) => {
  const { mutate: logout } = useLogout();

  return (
    <StyledDrawer open={open} onClose={onClose} anchor="right">
      <DrawerHeader>
        <PatientName>{userName}</PatientName>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DrawerHeader>
      <Box sx={{ padding: 1 }}>
        <Button
          variant="text"
          color="inherit"
          sx={{ textTransform: 'none' }}
          startIcon={<LogoutIcon />}
          onClick={() => logout()}
        >
          Log out
        </Button>
      </Box>
    </StyledDrawer>
  );
};
