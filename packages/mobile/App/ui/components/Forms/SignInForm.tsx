import React, {
  FunctionComponent,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Yup from 'yup';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { useAuth } from '~/ui/contexts/AuthContext';
import { readConfig } from '~/services/config';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { Form } from './Form';
import { Field } from './FormField';
import { TextField } from '../TextField/TextField';
import { SubmitButton } from './SubmitButton';
import { ServerSelector } from '../ServerSelectorField/ServerSelector';
import { TranslatedText } from '../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { TranslatedReferenceData } from '../Translations/TranslatedReferenceData';

interface SignInFormModelValues {
  email: string;
  password: string;
  server: string;
}

const ServerInfo = __DEV__
  ? ({ host }): ReactElement => {
      const { facilityName, facilityId } = useFacility();
      return (
        <StyledView marginBottom={10}>
          <StyledText color={theme.colors.WHITE}>
            <TranslatedText stringId="login.server.label" fallback="Server" />: {host}
          </StyledText>
          <StyledText color={theme.colors.WHITE}>
            <TranslatedText stringId="general.facility.label" fallback="Facility" />: <TranslatedReferenceData
            fallback={facilityName}
            value={facilityId}
            category="facility"
          />
          </StyledText>
        </StyledView>
      );
    }
  : (): ReactElement => null; // hide info on production

export const SignInForm: FunctionComponent<any> = ({ onError, onSuccess }) => {
  const [existingHost, setExistingHost] = useState('');
  const passwordRef = useRef(null);
  const { signIn } = useAuth();
  const { getTranslation } = useTranslation();

  const handleSignIn = useCallback(
    async (values: SignInFormModelValues) => {
      try {
        if (!existingHost && !values.server) {
          // TODO it would be better to properly respond to form validation and show the error
          onError(new Error('Please select a server to connect to'));
          return;
        }
        await signIn(values);
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
          .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address'))
          .required(getTranslation('validation.required.inline', '*Required')),
        password: Yup.string().required(getTranslation('validation.required.inline', '*Required')),
        server: existingHost
          ? Yup.string()
          : Yup.string().required(getTranslation('validation.required.inline', '*Required')),
      })}
      onSubmit={handleSignIn}
    >
      {({ handleSubmit }): ReactElement => (
        <StyledView
          marginTop={screenPercentageToDP(3.7, Orientation.Height)}
          marginRight={screenPercentageToDP(2.43, Orientation.Width)}
          marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
        >
          <StyledView justifyContent="space-around">
            {existingHost ? (
              <ServerInfo host={existingHost} />
            ) : (
              <Field
                name="server"
                component={ServerSelector}
                label={<TranslatedText stringId="general.country.label" fallback="Country" />}
              />
            )}
            <Field
              name="email"
              keyboardType="email-address"
              component={TextField}
              label={<TranslatedText stringId="login.email.label" fallback="Email" />}
              placeholder={
                <TranslatedText
                  stringId="login.email.placeholder"
                  fallback="Enter your email address"
                />
              }
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
              label={<TranslatedText stringId="login.password.label" fallback="Password" />}
              labelFontSize="14"
              placeholder={
                <TranslatedText
                  stringId="login.password.placeholder"
                  fallback="Enter your password"
                />
              }
              labelColor={theme.colors.WHITE}
              secure
              onSubmitEditing={handleSubmit}
            />
          </StyledView>
          <SubmitButton
            marginTop={existingHost ? 20 : 10}
            backgroundColor={theme.colors.SECONDARY_MAIN}
            textColor={theme.colors.TEXT_SUPER_DARK}
            fontSize={screenPercentageToDP('1.94', Orientation.Height)}
            fontWeight={500}
            buttonText={<TranslatedText stringId="auth.action.login" fallback="Log in" />}
          />
        </StyledView>
      )}
    </Form>
  );
};
