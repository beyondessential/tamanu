import React, {
  FunctionComponent,
  ReactElement,
  useRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import * as Yup from 'yup';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { useAuth } from '~/ui/contexts/AuthContext';
import { readConfig } from '~/services/config';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { Form } from './Form';
import { Field } from './FormField';
import { TextField } from '../TextField/TextField';
import { Button } from '../Button';
import { ServerSelector } from '../ServerSelectorField/ServerSelector';

interface SignInFormModelValues {
  email: string;
  password: string;
  server: string;
}

const REQUIRED_VALIDATION_MESSAGE = '*Required';

const ServerInfo = __DEV__
  ? ({ host }): ReactElement => {
      const { facilityName } = useFacility();
      return (
        <StyledView marginBottom={10}>
          <StyledText color={theme.colors.WHITE}>Server: {host}</StyledText>
          <StyledText color={theme.colors.WHITE}>Facility: {facilityName}</StyledText>
        </StyledView>
      );
    }
  : (): ReactElement => null; // hide info on production

export const SignInForm: FunctionComponent<any> = ({ onError, onSuccess }) => {
  const [existingHost, setExistingHost] = useState('');
  const passwordRef = useRef(null);
  const authCtx = useAuth();
  const signIn = useCallback(
    async (values: SignInFormModelValues) => {
      try {
        if (!existingHost && !values.server) {
          // TODO it would be better to properly respond to form validation and show the error
          onError(new Error('Please select a server to connect to'));
          return;
        }
        await authCtx.signIn(values);

        onSuccess();
      } catch (error) {
        onError(error);
      }
    },
    [existingHost],
  );

  useEffect(() => {
    (async (): Promise<void> => {
      const existing = await readConfig('syncServerLocation');
      if (existing) {
        setExistingHost(existing);
      }
    })();
  }, []);
  return (
    <Form
      initialValues={{
        email: '',
        password: '',
        server: '',
      }}
      validateOnChange={false}
      validateOnBlur={false}
      validationSchema={Yup.object().shape({
        email: Yup.string()
          .email('Must be a valid email address')
          .required(REQUIRED_VALIDATION_MESSAGE),
        password: Yup.string().required(REQUIRED_VALIDATION_MESSAGE),
        server: existingHost ? Yup.string() : Yup.string().required(REQUIRED_VALIDATION_MESSAGE),
      })}
      onSubmit={signIn}
    >
      {({ handleSubmit, isSubmitting }): ReactElement => (
        <StyledView
          marginTop={screenPercentageToDP(3.7, Orientation.Height)}
          marginRight={screenPercentageToDP(2.43, Orientation.Width)}
          marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
        >
          <StyledView justifyContent="space-around">
            {existingHost ? (
              <ServerInfo host={existingHost} />
            ) : (
              <Field name="server" component={ServerSelector} label="Country" />
            )}
            <Field
              name="email"
              keyboardType="email-address"
              component={TextField}
              label="Email"
              placeholder="Enter your email address"
              blurOnSubmit={false}
              returnKeyType="next"
              labelFontSize="14"
              labelColor={theme.colors.WHITE}
              onSubmitEditing={(): void => {
                passwordRef.current.focus();
              }}
            />
            <Field
              name="password"
              inputRef={passwordRef}
              autoCapitalize="none"
              component={TextField}
              label="Password"
              labelFontSize="14"
              placeholder="Enter your password"
              labelColor={theme.colors.WHITE}
              secure
              onSubmitEditing={handleSubmit}
            />
          </StyledView>
          <Button
            marginTop={20}
            backgroundColor={theme.colors.SECONDARY_MAIN}
            onPress={handleSubmit}
            loadingAction={isSubmitting}
            textColor={theme.colors.TEXT_SUPER_DARK}
            fontSize={screenPercentageToDP('1.94', Orientation.Height)}
            fontWeight={500}
            buttonText="Log in"
          />
        </StyledView>
      )}
    </Form>
  );
};
