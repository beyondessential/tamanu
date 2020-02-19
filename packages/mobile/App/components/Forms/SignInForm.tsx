import React, { FunctionComponent } from 'react';
import { Formik } from 'formik';
import { StyledView, StyledText } from '../../styled/common';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import { Field } from './FormField';
import { TextField } from '../TextField/TextField';
import { theme } from '../../styled/theme';
import { Button } from '../Button';

export const SignInForm: FunctionComponent<any> = () => (
  <Formik
    initialValues={{
      email: '',
      password: '',
    }}
    onSubmit={(): void => console.log('submit')}
  >
    <StyledView
      marginTop={screenPercentageToDP(14.70, Orientation.Height)}
      marginRight={screenPercentageToDP(2.43, Orientation.Width)}
      marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
    >
      <StyledText
        fontSize={13}
        marginBottom={5}
        color={theme.colors.SECONDARY_MAIN}
      >
        ACCOUNT DETAILS
      </StyledText>
      <StyledView
        height={screenPercentageToDP(7.29 * 2, Orientation.Height)}
        justifyContent="space-around"
      >
        <Field
          name="email"
          component={TextField}
          label="Email"
        />
        <Field
          name="password"
          component={TextField}
          label="Password"
        />
      </StyledView>
      <Button
        marginTop={20}
        backgroundColor={theme.colors.SECONDARY_MAIN}
        onPress={(): void => console.log('submiting')}
      >
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontWeight={500}
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
        >
          Sign in
        </StyledText>
      </Button>
    </StyledView>
  </Formik>
);
