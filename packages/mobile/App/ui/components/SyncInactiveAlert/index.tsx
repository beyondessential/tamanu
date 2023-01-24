import React, { useState } from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import Modal from 'react-native-modal';
import { theme } from '~/ui/styled/theme';
import { Alert, AlertSeverity } from '../Alert';
import { CrossIcon } from '../Icons';
import { useSelector } from 'react-redux';
import { authUserSelector } from '~/ui/helpers/selectors';
import * as Yup from 'yup';
import { Form } from '../Forms/Form';
import { Field } from '../Forms/FormField';
import { TextField } from '../TextField/TextField';
import { Button } from '../Button';

interface AuthenticationModelProps {
  open: boolean;
  onClose: () => void;
}

type AuthenticationValues = {
  password: string;
};

export const AuthenticationModal = ({ open, onClose }: AuthenticationModelProps): JSX.Element => {
  const user = useSelector(authUserSelector);
  const handleSignIn = async (payload: AuthenticationValues) => {};
  if (!open) return null;
  return (
    <Modal isVisible={open} onBackdropPress={onClose}>
      <StyledView
        padding={screenPercentageToDP(3.6, Orientation.Width)}
        background={theme.colors.WHITE}
        height={screenPercentageToDP(50, Orientation.Height)}
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
              <Button
                marginTop={20}
                backgroundColor={theme.colors.PRIMARY_MAIN}
                onPress={handleSubmit}
                loadingAction={isSubmitting}
                textColor={theme.colors.TEXT_SUPER_DARK}
                fontSize={screenPercentageToDP('1.94', Orientation.Height)}
                fontWeight={500}
                buttonText="Sign in"
              />
            </StyledView>
          )}
        </Form>
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
