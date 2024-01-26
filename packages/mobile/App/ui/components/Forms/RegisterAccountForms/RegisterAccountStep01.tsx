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

export const RegisterAccountStep01: FunctionComponent<any> = (props: {
  navigation: NavigationProp<any>;
}) => (
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

interface FormProps {
  navigation: NavigationProp<any>;
}

const Form: FunctionComponent<any> = ({ navigation }: FormProps) => (
  <Formik
    initialValues={{
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: null,
    }}
    validationSchema={Yup.object().shape({
      firstName: Yup.string().required(),
      lastName: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      phone: Yup.string()
        .min(PhoneMask.mask.length)
        .max(PhoneMask.mask.length)
        .required(),
      gender: Yup.string().required(),
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
            <Field component={TextField} name="firstName" label="First Name" />
          </StyledView>
          <StyledView flex={1}>
            <Field component={TextField} name="lastName" label="Last Name" />
          </StyledView>
        </RowView>
        <Field
          component={TextField}
          name="email"
          label="Email"
          keyboardType="email-address"
        />
        <Field
          component={MaskedTextField}
          keyboardType="number-pad"
          name="phone"
          label="Phone"
          options={PhoneMask}
          maskType="custom"
          returnType="done"
        />
        <Field
          name="gender"
          title="Gender"
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
