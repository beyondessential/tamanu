import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useState,
  ReactElement,
  useEffect,
} from 'react';
import * as Yup from 'yup';
import { KeyboardAvoidingView, StatusBar } from 'react-native';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  StyledTouchableOpacity,
  StyledText,
} from '/styled/common';
import { HomeBottomLogoIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';

import { Routes } from '/helpers/routes';
import { Button } from '/components/Button';
import { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import AuthContext from '~/ui/contexts/AuthContext';

import { Form } from '~/ui/components/Forms/Form';
import { Field } from '~/ui/components/Forms/FormField';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useBackend } from '~/ui/hooks';
import { FacilitySelectField } from './FacilitySelectField';

const selectFacilitySchema = Yup.object().shape({
  facilityId: Yup.string().required(),
});

async function fetchFacilityOptions({ syncSource }) {
  // download all facility options from the server
  // (this only shows up on first login so we can't guarantee 
  // that the facilities will be available locally yet)
  let cursor = 0;
  const facilities = [];
  while (true) {
    const response = await syncSource.get(`sync/facility`, {
      since: cursor,
      limit: 1,
    });
    if (response.records.length === 0) break;
    facilities.push(...response.records);
    cursor = response.cursor;
  }

  // TODO: remove this (helper to debug large lists)
  while (facilities.length < 150) {
    facilities.push({
      data: {
        id: facilities.length, name: `dummy-${facilities.length}`
      }
    });
  }

  // map them to select option format
  return facilities.map(f => ({
    label: f.data.name,
    value: f.data.id,
  }));
}

export const SelectFacilityForm = ({ onSubmitForm }) => {
  const backend = useBackend();
  const [facilityOptions, setFacilityOptions] = useState(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const facilities = await fetchFacilityOptions(backend);
      if (canceled) return;
      setFacilityOptions(facilities);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <Form
      initialValues={{}}
      validationSchema={selectFacilitySchema}
      onSubmit={onSubmitForm}
    >
      {({ handleSubmit, isSubmitting }): ReactElement => (
        <StyledView
          marginTop={screenPercentageToDP(14.7, Orientation.Height)}
        >
          <StyledView justifyContent="space-around">
            <Field
              name="facilityId"
              component={FacilitySelectField}
              label="Facility"
              options={facilityOptions || []}
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
  const { signOut } = useContext(AuthContext);

  const onSubmitForm = useCallback(async (values) => {
    await assignFacility(values.facilityId);
  }, []);

  useEffect(() => {
    // if we already have a facility id, immediately navigate onward to the home screen
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
          <StyledView
            width="100%"
            alignItems="center"
            marginTop={screenPercentageToDP(7.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(14.7, Orientation.Height)}
          >
          <HomeBottomLogoIcon
            size={screenPercentageToDP(7.29, Orientation.Height)}
              fill={theme.colors.SECONDARY_MAIN}
            />
            <StyledText
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              fontSize={screenPercentageToDP('2.55', Orientation.Height)}
              color={theme.colors.WHITE}
              fontWeight="bold"
            >
            Please link this device to a facility.
            </StyledText>
            <SelectFacilityForm
              onSubmitForm={onSubmitForm}
            />
          <StyledTouchableOpacity onPress={signOut}>
            <StyledText
              width="100%"
              textAlign="center"
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
              fontSize={screenPercentageToDP('1.57', Orientation.Height)}
              color={theme.colors.SECONDARY_MAIN}
            >
              Return to sign-in screen
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledSafeAreaView>
    </FullView>
  );
};
