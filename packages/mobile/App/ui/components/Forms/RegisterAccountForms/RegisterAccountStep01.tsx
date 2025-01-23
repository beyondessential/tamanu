import React, { FunctionComponent, ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { NavigationProp } from '@react-navigation/native';
// Components
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import { FullView, RowView, StyledText, StyledView } from '/styled/common';
import { MaskedTextField } from '../../TextField/MaskedTextField';
import { Button } from '../../Button';
import { RadioButtonGroup } from '../../RadioButtonGroup';
// Theme
import { theme } from '/styled/theme';
// Helpers
import { GenderOptions, PhoneMask } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedText } from '../../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

export const RegisterAccountStep01: FunctionComponent<any> = (props: {
  navigation: NavigationProp<any>;
}) => (
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

const Form: FunctionComponent<any> = () => {
  const { getTranslation } = useTranslation();
  return (
    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: null,
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
            PhoneMask.mask.length,
            getTranslation('validation.rule.nDigitPhone', 'Phone number must be :digits long', {
              replacements: {
                digits: PhoneMask.mask.length,
              },
            }),
          )
          .max(
            PhoneMask.mask.length,
            getTranslation('validation.rule.nDigitPhone', 'Phone number must be :digits long', {
              replacements: {
                digits: PhoneMask.mask.length,
              },
            }),
          )
          .required(),
        gender: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="registerAccount.gender.label" fallback="Gender" />,
          ),
      })}
      onSubmit={(values): void => console.log(values)}
    >
      {({ handleSubmit }: FormikHandlers): ReactNode => (
        <StyledView
          height={screenPercentageToDP(7.29 * 5, Orientation.Height)}
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
              />
            </StyledView>
          </RowView>
          <Field
            component={TextField}
            name="email"
            label={<TranslatedText stringId="login.email.label" fallback="Email" />}
            keyboardType="email-address"
          />
          <Field
            component={MaskedTextField}
            keyboardType="number-pad"
            name="phone"
            label={<TranslatedText stringId="registerAccount.phone.label" fallback="Phone" />}
            options={PhoneMask}
            maskType="custom"
            returnType="done"
          />
          <Field
            name="gender"
            title={<TranslatedText stringId="registerAccount.gender.label" fallback="Gender" />}
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
