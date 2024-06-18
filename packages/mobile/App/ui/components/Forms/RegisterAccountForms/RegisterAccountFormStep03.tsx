import React, { ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import { FullView, RowView, StyledText, StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { SubmitButton } from '../SubmitButton';
import { Button } from '../../Button';
import { RegisterAccountFormStep3FormValues } from '../../../contexts/RegisterAccountContext';
import { Checkbox } from '../../Checkbox';
import { TranslatedText } from '../../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

interface RegisterAccountFormStep03Props {
  onSubmit: (values: RegisterAccountFormStep3FormValues) => void;
  formState: RegisterAccountFormStep3FormValues;
  navigateFormStepBack: () => void;
}

export const RegisterAccountFormStep03 = (props: RegisterAccountFormStep03Props): JSX.Element => (
  <FullView justifyContent="center" padding={20}>
    <StyledText
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={theme.colors.SECONDARY_MAIN}
    >
      <TranslatedText
        stringId="registerAccount.accountInformation.title"
        fallback="ACCOUNT INFORMATION"
      />
    </StyledText>
    <Form {...props} />
  </FullView>
);

const Form = ({
  formState,
  onSubmit,
  navigateFormStepBack,
}: RegisterAccountFormStep03Props): JSX.Element => {
  const { getTranslation } = useTranslation();
  return (
    <Formik
      initialValues={{
        ...formState,
      }}
      validationSchema={Yup.object().shape({
        password: Yup.string()
          .required()
          .translatedLabel(<TranslatedText stringId="login.password.label" fallback="Password" />),
        confirmPassword: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="registerAccount.confirmPassword.label"
              fallback="Confirm password"
            />,
          ),
        readPrivacyPolice: Yup.boolean()
          .required()
          .oneOf([true], getTranslation('validation.rule.mustBeChecked', 'Must be checked')),
      })}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }: FormikHandlers): ReactNode => (
        <StyledView
          height={screenPercentageToDP(7.29 * 4, Orientation.Height)}
          width="100%"
          justifyContent="space-around"
        >
          <Field
            component={TextField}
            name="password"
            label={<TranslatedText stringId="login.password.label" fallback="Password" />}
            required
            secure
          />
          <Field
            component={TextField}
            name="confirmPassword"
            label={
              <TranslatedText
                stringId="registerAccount.confirmPassword.label"
                fallback="Confirm password"
              />
            }
            required
            secure
            returnKeyType="done"
          />
          <RowView alignItems="center">
            <Field
              component={Checkbox}
              name="readPrivacyPolice"
              background={theme.colors.MAIN_SUPER_DARK}
              color={theme.colors.SECONDARY_MAIN}
            />
            <StyledText marginLeft={10} fontSize={12} color={theme.colors.WHITE}>
              <TranslatedText
                stringId="registerAccount.readPrivacyPolicy.label"
                fallback="I have to read a privacy statement and agree to abide by it."
              />
            </StyledText>
          </RowView>
          <RowView height={screenPercentageToDP(6.07, Orientation.Height)} marginTop={10}>
            <Button
              flex={1}
              marginRight={10}
              onPress={navigateFormStepBack}
              outline
              borderColor={theme.colors.WHITE}
              buttonText={<TranslatedText stringId="general.action.back" fallback="Back" />}
              textColor={theme.colors.WHITE}
              disabled={isSubmitting}
            />
            <SubmitButton
              flex={1}
              buttonText={
                <TranslatedText
                  stringId="registerAccount.action.createAccount"
                  fallback="Create Account"
                />
              }
              backgroundColor={theme.colors.SECONDARY_MAIN}
              textColor={theme.colors.TEXT_SUPER_DARK}
            />
          </RowView>
        </StyledView>
      )}
    </Formik>
  );
};
