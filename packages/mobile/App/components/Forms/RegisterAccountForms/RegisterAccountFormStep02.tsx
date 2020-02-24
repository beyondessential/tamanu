import React, { FunctionComponent, ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import {
  StyledView,
  StyledText,
  FullView,
  RowView,
} from '../../../styled/common';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { theme } from '../../../styled/theme';
import { Button } from '../../Button';
import { Dropdown } from '../../Dropdown';
import { dropdownItems } from '../../Dropdown/fixture';
import { RegisterAccountFormStep2Props } from '../../../contexts/RegisterAccountContext';


interface RegisterAccountFormStep02 {
  onSubmit: (values: RegisterAccountFormStep2Props) => void;
  formState: RegisterAccountFormStep2Props;
  navigateFormStepBack: () => void;
}

export const RegisterAccountFormStep02: FunctionComponent<RegisterAccountFormStep02> = (
  props: RegisterAccountFormStep02,
) => (
  <FullView justifyContent="center" padding={20}>
    <StyledText
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={theme.colors.SECONDARY_MAIN}
    >
      EMPLOYER INFORMATION
    </StyledText>
    <Form
      {...props}
    />
  </FullView>
);


const Form: FunctionComponent<RegisterAccountFormStep02> = ({
  formState,
  onSubmit,
  navigateFormStepBack,
}: RegisterAccountFormStep02) => (
  <Formik
    initialValues={{
      ...formState,
    }}
    validationSchema={Yup.object().shape({
      role: Yup.string().required(),
      homeFacility: Yup.string().required(),
      profession: Yup.string(),
      professionalRegistrationNumber: Yup.string(),
      firstYearOfRegistration: Yup.string().min(4).max(4),
    })}
    onSubmit={onSubmit}
  >
    {({ handleSubmit }: FormikHandlers): ReactNode => (
      <StyledView
        height={screenPercentageToDP(7.29 * 6, Orientation.Height)}
        width="100%"
        justifyContent="space-around"
      >
        <Field
          component={Dropdown}
          options={dropdownItems}
          name="role"
          label="Role*"
          autoFocus
        />
        <Field
          component={Dropdown}
          options={dropdownItems}
          name="homeFacility"
          label="Home Facility*"
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
        <RowView marginTop={10}>
          <Button
            flex={1}
            marginRight={10}
            onPress={navigateFormStepBack}
            outline
            borderColor={theme.colors.WHITE}
            buttonText="Back"
            textColor={theme.colors.TEXT_SUPER_DARK}
          />
          <Button
            flex={1}
            onPress={handleSubmit}
            backgroundColor={theme.colors.SECONDARY_MAIN}
            buttonText="Next"
            textColor={theme.colors.TEXT_SUPER_DARK}
          />
        </RowView>
      </StyledView>
    )}
  </Formik>
);
