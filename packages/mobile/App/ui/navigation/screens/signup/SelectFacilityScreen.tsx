import React, { FunctionComponent, ReactElement, useCallback, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { StatusBar } from 'react-native';
import {
  FullView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { HomeBottomLogoIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';

import { Routes } from '/helpers/routes';
import { Button } from '/components/Button';
import { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import { useAuth } from '~/ui/contexts/AuthContext';

import { Form } from '~/ui/components/Forms/Form';
import { Field } from '~/ui/components/Forms/FormField';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useBackend } from '~/ui/hooks';
import { FacilitySelectField } from './FacilitySelectField';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

async function fetchFacilityOptions({ centralServer }) {
  // download all facility options from the server
  // (this only shows up on first login so we can't guarantee
  // that the facilities will be available locally yet)
  const { data: facilities } = await centralServer.get('facility', {});

  // map them to select option format
  return facilities.map((f: { name: string; id: string; }) => ({
    label: f.name,
    value: f.id,
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
  }, [backend]);

  const onSubmit = useCallback(
    async ({ facilityId }) => {
      const selected = facilityOptions.find(x => x.value === facilityId);
      if (selected) {
        onSubmitForm({ facilityId, facilityName: selected.label });
      } else {
        throw new Error('Submitted a facility that does not exist');
      }
    },
    [facilityOptions, onSubmitForm],
  );

  return (
    <Form
      initialValues={{}}
      validationSchema={Yup.object().shape({
        facilityId: Yup.string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="general.facility.label" fallback="Facility" />,
          ),
      })}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, isSubmitting }): ReactElement => (
        <StyledView marginTop={screenPercentageToDP(14.7, Orientation.Height)}>
          <StyledView justifyContent="space-around">
            <Field
              name="facilityId"
              component={FacilitySelectField}
              label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
              options={facilityOptions}
              placeholder={
                <TranslatedText stringId="login.facility.placeholder" fallback="Select facility" />
              }
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
            buttonText={<TranslatedText stringId="general.action.save" fallback="Save" />}
          />
        </StyledView>
      )}
    </Form>
  );
};

export const SelectFacilityScreen: FunctionComponent<any> = ({ navigation }: SignInProps) => {
  const { facilityId, assignFacility } = useFacility();
  const { signOut } = useAuth();
  const backend = useBackend();

  const onSubmitForm = useCallback(async values => {
    // Fetch facility-specific settings before assigning facility
    const { settings } = await backend.centralServer.setFacility(values.facilityId);
    if (settings) {
      await backend.settings.setSettings(settings);
    }
    await assignFacility(values.facilityId, values.facilityName);
    // trigger sync when user finish selecting the facility for the device
    await backend.syncManager.triggerSync();
  }, [assignFacility, backend.centralServer, backend.settings, backend.syncManager]);

  useEffect(() => {
    // if we already have a facility id, immediately navigate onward to the home screen
    if (facilityId) {
      navigation.replace(Routes.HomeStack.Index);
    }
  }, [facilityId, navigation]);

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
            <TranslatedText
              stringId="login.facility.heading"
              fallback="Please link this device to a facility."
            />
          </StyledText>
          <SelectFacilityForm onSubmitForm={onSubmitForm} />
          <StyledTouchableOpacity onPress={signOut}>
            <StyledText
              width="100%"
              textAlign="center"
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
              fontSize={screenPercentageToDP('1.57', Orientation.Height)}
              color={theme.colors.SECONDARY_MAIN}
            >
              <TranslatedText
                stringId="login.facility.action.returnToSignIn"
                fallback="Return to sign-in screen"
              />
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledSafeAreaView>
    </FullView>
  );
};
