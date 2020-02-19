import React, { FunctionComponent } from 'react';
import { Platform, KeyboardAvoidingView } from 'react-native';
import { StyledView, StyledSafeAreaView, FullView, RowView, StyledTouchableOpacity, StyledText } from '../../../styled/common';
import { Cross, User } from '../../../components/Icons';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { theme } from '../../../styled/theme';
import { SignInForm } from '../../../components/Forms/SignInForm';
import { SignInProps } from '../../../interfaces/Screens/SignUp/SignInProps';
import { Routes } from '../../../helpers/constants';


export const SignIn: FunctionComponent<any> = ({ navigation }: SignInProps) => (
  <FullView
    background={theme.colors.PRIMARY_MAIN}
  >
    <StyledSafeAreaView>
      <RowView
        width="100%"
        justifyContent="flex-end"
        position="absolute"
        top={Platform.OS === 'ios' ? 30 : 0}
      >
        <StyledTouchableOpacity
          onPress={(): void => navigation.navigate(Routes.SignUpStack.Intro)}
          padding={screenPercentageToDP(2.43, Orientation.Height)}
        >
          <Cross size={screenPercentageToDP(2.43, Orientation.Height)} />
        </StyledTouchableOpacity>
      </RowView>
      <StyledView
        width="100%"
        alignItems="center"
        marginTop={screenPercentageToDP(7.29, Orientation.Height)}
        marginBottom={screenPercentageToDP(14.70, Orientation.Height)}
      >
        <User
          size={screenPercentageToDP(7.29, Orientation.Height)}
          fill={theme.colors.SECONDARY_MAIN}
        />
        <StyledText
          marginTop={screenPercentageToDP('2.43', Orientation.Height)}
          fontSize={screenPercentageToDP('2.55', Orientation.Height)}
          color={theme.colors.WHITE}
          fontWeight="bold"
        >
          Sign in
        </StyledText>
      </StyledView>
      <KeyboardAvoidingView
        behavior="position"
      >
        <SignInForm />
        <StyledTouchableOpacity
          onPress={(): void => console.log('forgot password....')}
        >
          <StyledText
            width="100%"
            textAlign="center"
            marginTop={screenPercentageToDP('2.43', Orientation.Height)}
            marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
            fontSize={screenPercentageToDP('1.57', Orientation.Height)}
            color={theme.colors.SECONDARY_MAIN}
          >
            Forgot your password?
          </StyledText>
        </StyledTouchableOpacity>
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  </FullView>
);
