import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Drawer, IconButton, Button, Box, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import styledComponents from 'styled-components';
import { patientFormPalette, TranslatedText } from '@tamanu/ui-components';
import { useLogout } from '@api/mutations';
import { useProfilesQuery } from '@api/queries/useProfilesQuery';
import { useCurrentUser } from '@routes/PrivateRoute';
import { ProfileSummary } from '../../features/profiles/ProfileSummary';

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
  gap: 8,
  paddingLeft: theme.spacing(1),
  marginBottom: 12,
}));

const AccountEmail = styled(Typography)(() => ({
  fontSize: 16,
  overflowWrap: 'anywhere',
}));

const CurrentProfile = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 16,
  border: '1px solid var(--pf-primary)',
  borderRadius: 8,
  background: 'var(--pf-primary-tint)',
}));

// The drawer renders outside PortalRoot, so it needs the portal's palette of its own
const PaletteScope = styledComponents.div`
  ${patientFormPalette}
`;

interface MainMenuProps {
  open: boolean;
  onClose: () => void;
}

export const MainMenu = ({ open, onClose }: MainMenuProps) => {
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const currentPatient = useCurrentUser();
  const { data: profiles } = useProfilesQuery();
  const hasOtherProfiles = (profiles?.data.length ?? 0) > 1;

  return (
    <StyledDrawer open={open} onClose={onClose} anchor="right">
      <PaletteScope>
        <DrawerHeader>
          <AccountEmail>{profiles?.email}</AccountEmail>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DrawerHeader>
        <CurrentProfile>
          <ProfileSummary patient={currentPatient} />
          {hasOtherProfiles && (
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                onClose();
                navigate('/select-profile');
              }}
            >
              <TranslatedText
                stringId="patientPortal.menu.switchProfile"
                fallback="Switch profile"
              />
            </Button>
          )}
        </CurrentProfile>
        <Box sx={{ paddingTop: 2 }}>
          <Button
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none' }}
            startIcon={<LogoutIcon />}
            onClick={() => logout()}
          >
            <TranslatedText stringId="auth.action.logout" fallback="Log out" />
          </Button>
        </Box>
      </PaletteScope>
    </StyledDrawer>
  );
};
