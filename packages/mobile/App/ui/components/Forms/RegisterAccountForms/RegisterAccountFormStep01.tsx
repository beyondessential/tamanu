import React, { ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import { StyledView, StyledText, FullView, RowView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { MaskedTextField } from '../../TextField/MaskedTextField';
import { theme } from '/styled/theme';
import { Button } from '../../Button';
import { RadioButtonGroup } from '../../RadioButtonGroup';
import { RegisterAccountFormStep1FormValues } from '../../../contexts/RegisterAccountContext';
import { GenderOptions } from '/helpers/constants';

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
      PERSONAL INFORMATION
    </StyledText>
    <Form {...props} />
  </FullView>
);

const Form = ({
  onSubmit,
  formState,
}: RegisterAccountFormStep01Props): JSX.Element => (
  <Formik
    initialValues={{
      ...formState,
    }}
    validationSchema={Yup.object().shape({
      firstName: Yup.string().required(),
      lastName: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      phone: Yup.string()
        .min(13)
        .max(13),
      gender: Yup.string().required(),
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
              label="First Name"
              required
            />
          </StyledView>
          <StyledView flex={1}>
            <Field
              component={TextField}
              name="lastName"
              label="Last Name"
              required
            />
          </StyledView>
        </RowView>
        <Field
          component={TextField}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          required
        />
        <Field
          component={MaskedTextField}
          keyboardType="number-pad"
          name="phone"
          label="Phone"
          options={{
            mask: '9999 9999 999',
          }}
          maskType="custom"
          returnType="done"
        />
        <Field
          name="gender"
          label="Gender"
          component={RadioButtonGroup}
          options={GenderOptions}
        />

        <Button
          marginTop={10}
          onPress={handleSubmit}
          backgroundColor={theme.colors.SECONDARY_MAIN}
          buttonText="Next"
          textColor={theme.colors.TEXT_SUPER_DARK}
        />
      </StyledView>
    )}
  </Formik>
);
