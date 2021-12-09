import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useState,
  ReactElement,
  useEffect,
} from 'react';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { Platform, KeyboardAvoidingView, StatusBar } from 'react-native';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  RowView,
  StyledTouchableOpacity,
  StyledText,
} from '/styled/common';
import { CrossIcon, UserIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';

import { Routes } from '/helpers/routes';
import { ModalInfo } from '/components/ModalInfo';
import { Button } from '/components/Button';
import { authSelector } from '/helpers/selectors';
import { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import AuthContext from '~/ui/contexts/AuthContext';

import { Form } from '~/ui/components/Forms/Form';
import { Field } from '~/ui/components/Forms/FormField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { TextField } from '~/ui/components/TextField/TextField';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useNavigation } from '@react-navigation/native';

const selectFacilitySchema = Yup.object().shape({
  facilityId: Yup.string().required(),
});

export const SelectFacilityForm = ({ onSubmitForm }) => {
  return (
    <Form
      initialValues={{}}
      validationSchema={selectFacilitySchema}
      onSubmit={onSubmitForm}
    >
      {({ handleSubmit, isSubmitting }): ReactElement => (
        <StyledView
          marginTop={screenPercentageToDP(14.7, Orientation.Height)}
          marginRight={screenPercentageToDP(2.43, Orientation.Width)}
          marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
        >
          <StyledView justifyContent="space-around">
            <Field
              name="facilityId"
              component={TextField}
              label="Facility"
              placeholder="Select facility"
            />
          </StyledView>
          <Button
            marginTop={20}
            backgroundColor={theme.colors.SECONDARY_MAIN}
            onPress={handleSubmit}
            loadingAction={isSubmitting}
            textColor={theme.colors.TEXT_SUPER_DARK}
            fontSize={screenPercentageToDP('1.94', Orientation.Height)}
            fontWeight={500}
            buttonText="Save"
          />
        </StyledView>
      )}
    </Form>
  );
}


export const SelectFacilityScreen: FunctionComponent<any> = ({ navigation }: SignInProps) => {
  const { facilityId, assignFacility } = useFacility();

  const onSubmitForm = useCallback(async (values) => {
    console.log("preassign");
    await assignFacility(values.facilityId);
    console.log("postassign");
  }, []);

  const signOut = useCallback(() => {
    navigation.replace(Routes.SignUpStack.Index);
  }, []);

  useEffect(() => {
    if (facilityId) {
      navigation.replace(Routes.HomeStack.Index);
    }
  }, [facilityId]);

  if (facilityId) {
    return null;
  }

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <StatusBar barStyle="light-content" />
      <StyledSafeAreaView>
        <KeyboardAvoidingView behavior="position">
          <StyledView
            width="100%"
            alignItems="center"
            marginTop={screenPercentageToDP(7.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(14.7, Orientation.Height)}
          >
            <UserIcon
              height={screenPercentageToDP(7.29, Orientation.Height)}
              width={screenPercentageToDP(7.29, Orientation.Height)}
              fill={theme.colors.SECONDARY_MAIN}
            />
            <StyledText
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              fontSize={screenPercentageToDP('2.55', Orientation.Height)}
              color={theme.colors.WHITE}
              fontWeight="bold"
            >
              Select facility
            </StyledText>
            <SelectFacilityForm
              onSubmitForm={onSubmitForm}
            />
            <Button
              marginTop={20}
              backgroundColor={theme.colors.SECONDARY_MAIN}
              onPress={signOut}
              textColor={theme.colors.TEXT_SUPER_DARK}
              fontSize={screenPercentageToDP('1.94', Orientation.Height)}
              fontWeight={500}
              buttonText="Sign out"
            />
          </StyledView>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
