import React, { ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import { StyledView, StyledText, FullView, RowView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { Button } from '../../Button';
import { Dropdown } from '../../Dropdown';
import { dropdownItems } from '../../Dropdown/fixture';
import { RegisterAccountFormStep2FormValues } from '../../../contexts/RegisterAccountContext';
import { userRolesOptions } from '/helpers/constants';

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
      EMPLOYER INFORMATION
    </StyledText>
    <Form {...props} />
  </FullView>
);

const Form = ({
  formState,
  onSubmit,
  navigateFormStepBack,
}: RegisterAccountFormStep02Props): JSX.Element => (
  <Formik
    initialValues={{
      ...formState,
    }}
    validationSchema={Yup.object().shape({
      role: Yup.string().required(),
      homeFacility: Yup.string().required(),
      profession: Yup.string(),
      professionalRegistrationNumber: Yup.string(),
      firstYearOfRegistration: Yup.string()
        .min(4)
        .max(4),
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
            label="Role"
            autoFocus
            required
          />
          <Field
            component={Dropdown}
            options={dropdownItems}
            name="homeFacility"
            label="Home Facility"
            required
          />
          <Field component={TextField} name="profession" label="Profession" />
          <Field
            component={TextField}
            name="professionalRegistrationNumber"
            label="Professional Registration Number"
            keyboardType="number-pad"
            returnKeyType="done"
          />
          <Field
            component={TextField}
            name="firstYearOfRegistration"
            label="First Year of Registration"
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
            buttonText="Back"
            textColor={theme.colors.WHITE}
          />
          <Button
            flex={1}
            onPress={handleSubmit}
            backgroundColor={theme.colors.SECONDARY_MAIN}
            buttonText="Next"
            textColor={theme.colors.TEXT_SUPER_DARK}
          />
        </RowView>
      </>
    )}
  </Formik>
);
