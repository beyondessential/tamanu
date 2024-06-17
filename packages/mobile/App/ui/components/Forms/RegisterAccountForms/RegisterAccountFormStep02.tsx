import React, { ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import { FullView, RowView, StyledText, StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { Button } from '../../Button';
import { Dropdown } from '../../Dropdown';
import { dropdownItems } from '../../Dropdown/fixture';
import { RegisterAccountFormStep2FormValues } from '../../../contexts/RegisterAccountContext';
import { userRolesOptions } from '/helpers/constants';
import { TranslatedText } from '../../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

interface RegisterAccountFormStep02Props {
  onSubmit: (values: RegisterAccountFormStep2FormValues) => void;
  formState: RegisterAccountFormStep2FormValues;
  navigateFormStepBack: () => void;
}

export const RegisterAccountFormStep02 = (props: RegisterAccountFormStep02Props): JSX.Element => (
  <FullView justifyContent="center" padding={20}>
    <StyledText
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={theme.colors.SECONDARY_MAIN}
    >
      <TranslatedText
        stringId="registerAccount.employerInformation.title"
        fallback="EMPLOYER INFORMATION"
      />
    </StyledText>
    <Form {...props} />
  </FullView>
);

const Form = ({
  formState,
  onSubmit,
  navigateFormStepBack,
}: RegisterAccountFormStep02Props): JSX.Element => {
  const { getTranslation } = useTranslation();
  return (
    <Formik
      initialValues={{
        ...formState,
      }}
      validationSchema={Yup.object().shape({
        role: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="registerAccount.role.label" fallback="Role" />,
          ),
        homeFacility: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="registerAccount.homeFacility.label"
              fallback="Home Facility"
            />,
          ),
        profession: Yup.string(),
        professionalRegistrationNumber: Yup.string(),
        firstYearOfRegistration: Yup.string()
          .min(4, getTranslation('validation.rule.exactly4Characters', 'Must be 4 characters'))
          .max(4, getTranslation('validation.rule.exactly4Characters', 'Must be 4 characters')),
      })}
      onSubmit={onSubmit}
    >
      {({ handleSubmit }: FormikHandlers): ReactNode => (
        <>
          <StyledView
            height={screenPercentageToDP(37.45, Orientation.Height)}
            width="100%"
            justifyContent="space-around"
          >
            <Field
              component={Dropdown}
              options={userRolesOptions}
              name="role"
              label={<TranslatedText stringId="registerAccount.role.label" fallback="Role" />}
              autoFocus
              required
            />
            <Field
              component={Dropdown}
              options={dropdownItems}
              name="homeFacility"
              label={
                <TranslatedText
                  stringId="registerAccount.homeFacility.label"
                  fallback="Home Facility"
                />
              }
              required
            />
            <Field
              component={TextField}
              name="profession"
              label={
                <TranslatedText stringId="registerAccount.profession.label" fallback="Profession" />
              }
            />
            <Field
              component={TextField}
              name="professionalRegistrationNumber"
              label={
                <TranslatedText
                  stringId="registerAccount.professionalRegistrationNumber.label"
                  fallback="Professional Registration Number"
                />
              }
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <Field
              component={TextField}
              name="firstYearOfRegistration"
              label={
                <TranslatedText
                  stringId="registerAccount.firstYearOfRegistration.label"
                  fallback="First Year of Registration"
                />
              }
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </StyledView>
          <RowView
            height={screenPercentageToDP(6.07, Orientation.Height)}
            marginTop={screenPercentageToDP(1.21, Orientation.Height)}
          >
            <Button
              flex={1}
              marginRight={screenPercentageToDP(2.43, Orientation.Width)}
              onPress={navigateFormStepBack}
              outline
              borderColor={theme.colors.WHITE}
              buttonText={<TranslatedText stringId="general.action.back" fallback="Back" />}
              textColor={theme.colors.WHITE}
            />
            <Button
              flex={1}
              onPress={handleSubmit}
              backgroundColor={theme.colors.SECONDARY_MAIN}
              buttonText={<TranslatedText stringId="general.action.next" fallback="Next" />}
              textColor={theme.colors.TEXT_SUPER_DARK}
            />
          </RowView>
        </>
      )}
    </Formik>
  );
};
