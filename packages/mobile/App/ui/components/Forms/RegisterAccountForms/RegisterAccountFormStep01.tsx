import React, { ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import { FullView, RowView, StyledText, StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { MaskedTextField } from '../../TextField/MaskedTextField';
import { theme } from '/styled/theme';
import { Button } from '../../Button';
import { RadioButtonGroup } from '../../RadioButtonGroup';
import { RegisterAccountFormStep1FormValues } from '../../../contexts/RegisterAccountContext';
import { GenderOptions } from '/helpers/constants';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { TranslatedText } from '../../Translations/TranslatedText';

interface RegisterAccountFormStep01Props {
  onSubmit: (values: RegisterAccountFormStep1FormValues) => void;
  formState: RegisterAccountFormStep1FormValues;
}

export const RegisterAccountFormStep01 = (props: RegisterAccountFormStep01Props): JSX.Element => (
  <FullView justifyContent="center" padding={20}>
    <StyledText
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={theme.colors.SECONDARY_MAIN}
    >
      <TranslatedText
        stringId="registerAccount.personalInformation.title"
        fallback="PERSONAL INFORMATION"
      />
    </StyledText>
    <Form {...props} />
  </FullView>
);

const Form = ({ onSubmit, formState }: RegisterAccountFormStep01Props): JSX.Element => {
  const { getTranslation } = useTranslation();
  return (
    <Formik
      initialValues={{
        ...formState,
      }}
      validationSchema={Yup.object().shape({
        firstName: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
            />,
          ),
        lastName: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
            />,
          ),
        email: Yup.string()
          .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address'))
          .required()
          .translatedLabel(<TranslatedText stringId="login.email.label" fallback="Email" />),
        phone: Yup.string()
          .min(
            13,
            getTranslation('validation.rule.nDigitPhone', 'Phone number must be :digits long', {
              replacements: {
                digits: 13,
              },
            }),
          )
          .max(
            13,
            getTranslation('validation.rule.nDigitPhone', 'Phone number must be :digits long', {
              replacements: {
                digits: 13,
              },
            }),
          ),
        gender: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="registerAccount.gender.label" fallback="Gender" />,
          ),
      })}
      onSubmit={onSubmit}
    >
      {({ handleSubmit }: FormikHandlers): ReactNode => (
        <StyledView
          height={screenPercentageToDP(7.29 * 6, Orientation.Height)}
          width="100%"
          justifyContent="space-around"
        >
          <RowView>
            <StyledView flex={1} marginRight={5}>
              <Field
                component={TextField}
                name="firstName"
                label={
                  <TranslatedText
                    stringId="general.localisedField.firstName.label"
                    fallback="First name"
                  />
                }
                required
              />
            </StyledView>
            <StyledView flex={1}>
              <Field
                component={TextField}
                name="lastName"
                label={
                  <TranslatedText
                    stringId="general.localisedField.lastName.label"
                    fallback="Last name"
                  />
                }
                required
              />
            </StyledView>
          </RowView>
          <Field
            component={TextField}
            name="email"
            label={<TranslatedText stringId="login.email.label" fallback="Email" />}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />
          <Field
            component={MaskedTextField}
            keyboardType="number-pad"
            name="phone"
            label={<TranslatedText stringId="registerAccount.phone.label" fallback="Phone" />}
            options={{
              mask: '9999 9999 999',
            }}
            maskType="custom"
            returnType="done"
          />
          <Field
            name="gender"
            label={<TranslatedText stringId="registerAccount.gender.label" fallback="Gender" />}
            component={RadioButtonGroup}
            options={GenderOptions}
          />

          <Button
            marginTop={10}
            onPress={handleSubmit}
            backgroundColor={theme.colors.SECONDARY_MAIN}
            buttonText={<TranslatedText stringId="general.action.next" fallback="Next" />}
            textColor={theme.colors.TEXT_SUPER_DARK}
          />
        </StyledView>
      )}
    </Formik>
  );
};
