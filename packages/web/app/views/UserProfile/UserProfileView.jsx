import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, Typography, Button, Card, CardContent } from '@material-ui/core';
import { Person, Lock } from '@material-ui/icons';

import { useAuth } from '../../contexts/Auth';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { TopBar } from '../../components/TopBar';
import { ChangePasswordModal } from '../../components/UserProfile/ChangePasswordModal';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProfileCard = styled(Card)`
  margin-bottom: 2rem;
  border: 1px solid ${Colors.outline};
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ProfileIcon = styled(Person)`
  font-size: 3rem;
  color: ${Colors.primary};
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled(Typography)`
  min-width: 120px;
  font-weight: 500;
  color: ${Colors.darkText};
`;

const InfoValue = styled(Typography)`
  color: ${Colors.text};
`;

const ActionSection = styled.div`
  border-top: 1px solid ${Colors.outline};
  padding-top: 1.5rem;
  margin-top: 1.5rem;
`;

const ActionButton = styled(Button)`
  margin-right: 1rem;
  text-transform: none;
`;

export const UserProfileView = () => {
  const { currentUser } = useAuth();
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const handleChangePassword = () => {
    setChangePasswordModalOpen(true);
  };

  return (
    <>
      <TopBar
        title={
          <TranslatedText
            stringId="userProfile.title"
            fallback="User Profile"
            data-testid="translatedtext-profile-title"
          />
        }
      />
      <Container data-testid="container-user-profile">
        <ProfileCard data-testid="profilecard-main">
          <CardContent data-testid="cardcontent-profile">
            <ProfileHeader data-testid="profileheader-main">
              <ProfileIcon data-testid="profileicon-person" />
              <Box data-testid="box-profile-info">
                <Typography variant="h4" data-testid="typography-display-name">
                  {currentUser.displayName}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" data-testid="typography-role">
                  {currentUser.role}
                </Typography>
              </Box>
            </ProfileHeader>

            <InfoRow data-testid="inforow-email">
              <InfoLabel data-testid="infolabel-email">
                <TranslatedText
                  stringId="general.localisedField.email.label"
                  fallback="Email"
                  data-testid="translatedtext-email-label"
                />
                :
              </InfoLabel>
              <InfoValue data-testid="infovalue-email">
                {currentUser.email}
              </InfoValue>
            </InfoRow>

            <InfoRow data-testid="inforow-role">
              <InfoLabel data-testid="infolabel-role">
                <TranslatedText
                  stringId="general.localisedField.role.label"
                  fallback="Role"
                  data-testid="translatedtext-role-label"
                />
                :
              </InfoLabel>
              <InfoValue data-testid="infovalue-role">
                {currentUser.role}
              </InfoValue>
            </InfoRow>

            {currentUser.displayId && (
              <InfoRow data-testid="inforow-display-id">
                <InfoLabel data-testid="infolabel-display-id">
                  <TranslatedText
                    stringId="general.localisedField.displayId.label"
                    fallback="Display ID"
                    data-testid="translatedtext-display-id-label"
                  />
                  :
                </InfoLabel>
                <InfoValue data-testid="infovalue-display-id">
                  {currentUser.displayId}
                </InfoValue>
              </InfoRow>
            )}

            {currentUser.phoneNumber && (
              <InfoRow data-testid="inforow-phone">
                <InfoLabel data-testid="infolabel-phone">
                  <TranslatedText
                    stringId="general.localisedField.phoneNumber.label"
                    fallback="Phone Number"
                    data-testid="translatedtext-phone-label"
                  />
                  :
                </InfoLabel>
                <InfoValue data-testid="infovalue-phone">
                  {currentUser.phoneNumber}
                </InfoValue>
              </InfoRow>
            )}

            <ActionSection data-testid="actionsection-main">
              <ActionButton
                variant="contained"
                color="primary"
                startIcon={<Lock data-testid="lock-icon" />}
                onClick={handleChangePassword}
                data-testid="actionbutton-change-password"
              >
                <TranslatedText
                  stringId="userProfile.action.changePassword"
                  fallback="Change Password"
                  data-testid="translatedtext-change-password"
                />
              </ActionButton>
            </ActionSection>
          </CardContent>
        </ProfileCard>
      </Container>

      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        data-testid="changepasswordmodal-main"
      />
    </>
  );
};