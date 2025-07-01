import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Typography, Button, Card, CardContent, CircularProgress } from '@material-ui/core';
import { Person, Lock, Error } from '@material-ui/icons';

import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api';
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: ${Colors.alert};
`;

export const UserProfileView = () => {
  const { currentUser } = useAuth();
  const api = useApi();
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('user/me');
        setUserDetails(response);
        setError(null);
      } catch (err) {
        setError('Failed to load user details');
        console.error('Error fetching user details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchUserDetails();
    } else {
      setIsLoading(false);
    }
  }, [api, currentUser]);

  const handleChangePassword = () => {
    setChangePasswordModalOpen(true);
  };

  const handlePasswordChangeSuccess = () => {
    setChangePasswordModalOpen(false);
  };

  if (!currentUser) {
    return (
      <ErrorContainer data-testid="error-no-user">
        <Error />
        <Typography variant="h6" data-testid="error-message">
          <TranslatedText
            stringId="userProfile.error.notLoggedIn"
            fallback="You must be logged in to view your profile"
            data-testid="translatedtext-not-logged-in"
          />
        </Typography>
      </ErrorContainer>
    );
  }

  if (isLoading) {
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
        <LoadingContainer data-testid="loading-container">
          <CircularProgress data-testid="loading-spinner" />
        </LoadingContainer>
      </>
    );
  }

  if (error) {
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
        <ErrorContainer data-testid="error-container">
          <Error />
          <Typography variant="h6" data-testid="error-message">
            {error}
          </Typography>
        </ErrorContainer>
      </>
    );
  }

  const displayUser = userDetails || currentUser;

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
                  {displayUser.displayName}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" data-testid="typography-role">
                  {displayUser.role}
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
                {displayUser.email}
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
                {displayUser.role}
              </InfoValue>
            </InfoRow>

            {displayUser.displayId && (
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
                  {displayUser.displayId}
                </InfoValue>
              </InfoRow>
            )}

            {displayUser.phoneNumber && (
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
                  {displayUser.phoneNumber}
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
        onSuccess={handlePasswordChangeSuccess}
        data-testid="changepasswordmodal-main"
      />
    </>
  );
};