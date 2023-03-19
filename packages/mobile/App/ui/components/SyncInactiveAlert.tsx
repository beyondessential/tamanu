import React, { useEffect, useState } from 'react';
import Modal from 'react-native-modal';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import { useNetInfo } from '@react-native-community/netinfo';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Alert, AlertSeverity } from './Alert';
import { CrossIcon } from './Icons';
import { authUserSelector } from '~/ui/helpers/selectors';
import { Form } from './Forms/Form';
import { Field } from './Forms/FormField';
import { TextField } from './TextField/TextField';
import { Button } from './Button';
import { useAuth } from '~/ui/contexts/AuthContext';
import { CentralConnectionStatus } from '~/types';
import { useBackend } from '../hooks';

interface AuthenticationModelProps {
  open: boolean;
  onClose: () => void;
}

type AuthenticationValues = {
  password: string;
};

const AuthenticationModal = ({ open, onClose }: AuthenticationModelProps): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const user = useSelector(authUserSelector);
  const authCtx = useAuth();
  const handleSignIn = async (payload: AuthenticationValues): Promise<void> => {
    try {
      await authCtx.reconnectWithPassword(payload);
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  useEffect(() => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [open]);

  return (
    <Modal isVisible={open} onBackdropPress={onClose}>
      <StyledView
        padding={screenPercentageToDP(3.6, Orientation.Width)}
        background={theme.colors.WHITE}
        height={screenPercentageToDP(errorMessage ? 55 : 50, Orientation.Height)}
        paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
        borderRadius={5}
      >
        <StyledView height={screenPercentageToDP(4, Orientation.Height)}>
          <StyledView position="absolute" right={0}>
            <StyledTouchableOpacity onPress={onClose}>
              <CrossIcon
                fill={theme.colors.TEXT_SUPER_DARK}
                size={screenPercentageToDP(2.9, Orientation.Height)}
              />
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
        <StyledText
          fontSize={screenPercentageToDP(4.8, Orientation.Width)}
          fontWeight={600}
          color={theme.colors.TEXT_SUPER_DARK}
          marginBottom={screenPercentageToDP(3.2, Orientation.Height)}
          textAlign="center"
        >
          Reconnect sync
        </StyledText>
        <StyledText
          fontSize={screenPercentageToDP(3.6, Orientation.Width)}
          color={theme.colors.TEXT_SUPER_DARK}
          textAlign="center"
          paddingLeft={screenPercentageToDP(9, Orientation.Width)}
          paddingRight={screenPercentageToDP(9, Orientation.Width)}
          marginBottom={screenPercentageToDP(3.2, Orientation.Height)}
        >
          Your sync connection has timed out. Please enter your password to reconnect.
        </StyledText>
        <StyledText
          textAlign="center"
          fontSize={screenPercentageToDP(4, Orientation.Width)}
          fontWeight={600}
          color={theme.colors.TEXT_SUPER_DARK}
          marginBottom={screenPercentageToDP(3.2, Orientation.Height)}
        >
          {user.email}
        </StyledText>
        <Form
          initialValues={{
            password: '',
          }}
          validationSchema={Yup.object().shape({
            password: Yup.string().required('Password is required'),
          })}
          onSubmit={handleSignIn}
        >
          {({ handleSubmit, isSubmitting }): JSX.Element => (
            <StyledView>
              <Field
                name="password"
                autoCapitalize="none"
                component={TextField}
                label="Password"
                secure
              />
              <StyledView
                marginTop={screenPercentageToDP(3.2, Orientation.Height)}
                alignItems="center"
              >
                {errorMessage && (
                  <StyledText
                    color={theme.colors.ALERT}
                    marginBottom={screenPercentageToDP(3.2, Orientation.Height)}
                    fontSize={screenPercentageToDP(1.57, Orientation.Height)}
                    textAlign="center"
                  >
                    {errorMessage}
                  </StyledText>
                )}
                <Button
                  backgroundColor={theme.colors.PRIMARY_MAIN}
                  onPress={handleSubmit}
                  loadingAction={isSubmitting}
                  textColor={theme.colors.WHITE}
                  width={screenPercentageToDP(50, Orientation.Width)}
                  fontSize={screenPercentageToDP(1.94, Orientation.Height)}
                  fontWeight={500}
                  buttonText="Submit"
                />
              </StyledView>
            </StyledView>
          )}
        </Form>
      </StyledView>
    </Modal>
  );
};

export const SyncInactiveAlert = (): JSX.Element => {
  const [openAuthenticationModel, setOpenAuthenticationModel] = useState(false);
  const [open, setOpen] = useState(false);

  const netInfo = useNetInfo();
  const { centralServer } = useBackend();

  const handleClose = (): void => setOpen(false);
  const handleOpen = (): void => setOpen(true);
  const handleOpenModal = (): void => setOpenAuthenticationModel(true);
  const handleCloseModal = (): void => setOpenAuthenticationModel(false);

  const handleStatusChange = (
    status: CentralConnectionStatus,
    isInternetReachable: boolean,
  ): void => {
    if (
      status === CentralConnectionStatus.Disconnected
      // Reconnection with central is not possible if there is no internet connection
    ) {
      if (isInternetReachable) {
        handleOpen();
      } else if (open) {
        handleClose();
      }
    }
    if (status === CentralConnectionStatus.Connected && open) {
      handleClose();
    }
  };

  useEffect(() => {
    const handler = (status: CentralConnectionStatus): void => {
      handleStatusChange(status, netInfo.isInternetReachable);
    };
    centralServer.emitter.on('statusChange', handler);
    return () => {
      centralServer.emitter.off('statusChange', handler);
    };
  }, [netInfo.isInternetReachable, open]);

  return (
    <>
      <Alert open={open} onClose={handleClose} severity={AlertSeverity.Info}>
        <StyledText
          color={theme.colors.PRIMARY_MAIN}
          fontSize={screenPercentageToDP(1.68, Orientation.Height)}
        >
          Sync inactive.
        </StyledText>
        <StyledTouchableOpacity onPress={handleOpenModal}>
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
