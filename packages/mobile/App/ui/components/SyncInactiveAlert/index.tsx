import React, { useState } from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import {
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '~/ui/styled/common';
import Modal from 'react-native-modal';
import { theme } from '~/ui/styled/theme';
import { Alert, AlertSeverity } from '../Alert';
import { CrossIcon } from '../Icons';

interface AuthenticationModelProps {
  open: boolean;
  onClose: () => void;
}

export const AuthenticationModal = ({ open, onClose }: AuthenticationModelProps): JSX.Element => {
  if (!open) return null;
  return (
    <Modal isVisible={open} onBackdropPress={onClose}>
      <StyledView
        padding={screenPercentageToDP(3.6, Orientation.Width)}
        background={theme.colors.WHITE}
        height={screenPercentageToDP(30, Orientation.Height)}
        paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
        borderRadius={5}
      >
        <StyledView height={screenPercentageToDP(4, Orientation.Height)}>
          <StyledView position="absolute" right={0}>
            <StyledTouchableOpacity onPress={onClose}>
              <CrossIcon
                fill={theme.colors.TEXT_SUPER_DARK}
                size={screenPercentageToDP(3, Orientation.Height)}
              />
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
        <StyledText
          fontSize={screenPercentageToDP(5, Orientation.Width)}
          fontWeight={500}
          color={theme.colors.TEXT_SUPER_DARK}
          marginBottom={screenPercentageToDP(2.43, Orientation.Height)}
          textAlign="center"
        >
          Reconnect sync
        </StyledText>
        <StyledText
          fontSize={screenPercentageToDP(3.6, Orientation.Width)}
          color={theme.colors.TEXT_SUPER_DARK}
          textAlign="center"
        >
          Your sync connection has timed out. Please enter your password to reconnect.
        </StyledText>
      </StyledView>
    </Modal>
  );
};

export const SyncInactiveAlert = (): JSX.Element => {
  const [openAuthenticationModel, setOpenAuthenticationModel] = useState(false);
  const handleShowModal = (): void => setOpenAuthenticationModel(true);
  const handleCloseModal = (): void => setOpenAuthenticationModel(false);
  return (
    <>
      <Alert severity={AlertSeverity.Info}>
        <StyledText
          color={theme.colors.PRIMARY_MAIN}
          fontSize={screenPercentageToDP(1.68, Orientation.Height)}
        >
          Sync inactive.
        </StyledText>
        <StyledTouchableOpacity onPress={handleShowModal}>
          <StyledText
            marginLeft={screenPercentageToDP(1, Orientation.Width)}
            color={theme.colors.PRIMARY_MAIN}
            textDecorationLine="underline"
            fontSize={screenPercentageToDP(1.68, Orientation.Height)}
          >
            Click here to reconnnect.
          </StyledText>
        </StyledTouchableOpacity>
      </Alert>
      <AuthenticationModal open={openAuthenticationModel} onClose={handleCloseModal} />
    </>
  );
};
