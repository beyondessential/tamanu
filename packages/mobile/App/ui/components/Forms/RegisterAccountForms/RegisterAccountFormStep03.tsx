import React, { ReactNode } from 'react';
import { Formik, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { TextField } from '../../TextField/TextField';
import { Field } from '../FormField';
import { StyledView, StyledText, FullView, RowView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { Button } from '../../Button';
import { RegisterAccountFormStep3FormValues } from '../../../contexts/RegisterAccountContext';
import { Checkbox } from '../../Checkbox';

interface RegisterAccountFormStep03Props {
  onSubmit: (values: RegisterAccountFormStep3FormValues) => void;
  formState: RegisterAccountFormStep3FormValues;
  navigateFormStepBack: () => void;
}

export const RegisterAccountFormStep03 = (
  props: RegisterAccountFormStep03Props,
): JSX.Element => (
  <FullView justifyContent="center" padding={20}>
    <StyledText
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={theme.colors.SECONDARY_MAIN}
    >
      CREATE PASSWORD
    </StyledText>
    <Form {...props} />
  </FullView>
);

const Form = ({
  formState,
  onSubmit,
  navigateFormStepBack,
}: RegisterAccountFormStep03Props): JSX.Element => (
  <Formik
    initialValues={{
      ...formState,
    }}
    validationSchema={Yup.object().shape({
      password: Yup.string().required(),
      confirmPassword: Yup.string().required(),
      readPrivacyPolice: Yup.boolean()
        .required()
        .oneOf([true], 'Field must be checked'),
    })}
    onSubmit={onSubmit}
  >
    {({ handleSubmit }: FormikHandlers): ReactNode => (
      <StyledView
        height={screenPercentageToDP(7.29 * 4, Orientation.Height)}
        width="100%"
        justifyContent="space-around"
      >
        <Field
          component={TextField}
          name="password"
          label="Password"
          required
          secure
        />
        <Field
          component={TextField}
          name="confirmPassword"
          label="Confirm Password"
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
            I have to read a privacy statement and agree to abide by it.
          </StyledText>
        </RowView>
        <RowView
          height={screenPercentageToDP(6.07, Orientation.Height)}
          marginTop={10}
        >
          <Button
            flex={1}
            marginRight={10}
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
            buttonText="Create Account"
            textColor={theme.colors.TEXT_SUPER_DARK}
          />
        </RowView>
      </StyledView>
    )}
  </Formik>
);
