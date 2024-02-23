import React, { ReactElement, useEffect } from 'react';
import { RowView, StyledView } from '/styled/common';
import { Subheading } from 'react-native-paper';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { theme } from '~/ui/styled/theme';
import { Routes } from '~/ui/helpers/routes';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useBackendEffect } from '~/ui/hooks/index';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { useAuth } from '~/ui/contexts/AuthContext';

export const PatientProgramRegistrationList = ({ selectedPatient }): ReactElement => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { ability } = useAuth();
  const canReadRegistrations = ability.can('read', 'PatientProgramRegistration');
  const [registrations, registrationError, isRegistrationLoading] = useBackendEffect(
    async ({ models }) =>
      await models.PatientProgramRegistration.getMostRecentRegistrationsForPatient(
        selectedPatient.id,
      ),
    [isFocused, selectedPatient.id],
  );
  if (isRegistrationLoading) return <LoadingScreen />;

  if (registrationError) return <ErrorScreen error={registrationError} />;

  if (registrations.length === 0) {
    return (
      <RowView paddingTop={10} paddingBottom={10}>
        <Subheading>No program registries to display</Subheading>
      </RowView>
    );
  }

  const onNavigateToPatientProgramRegistrationDetails = (item: any) => {
    navigation.navigate(Routes.HomeStack.PatientProgramRegistrationDetailsStack.Index, {
      patientProgramRegistration: item,
    });
  };

  const ItemWrapper = canReadRegistrations ? TouchableOpacity : View;
  return (
    <FlatList
      data={registrations}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <ItemWrapper onPress={() => onNavigateToPatientProgramRegistrationDetails(item)}>
          <StyledView paddingTop={10} paddingBottom={10}>
            <RowView justifyContent="space-between">
              <RowView>
                <StyledView
                  borderRadius={100}
                  height={7}
                  width={7}
                  background={
                    item.registrationStatus === 'active'
                      ? theme.colors.SAFE
                      : theme.colors.DISABLED_GREY
                  }
                  marginTop={10}
                  marginRight={10}
                />
                <StyledView maxWidth={screenPercentageToDP(60, Orientation.Width)}>
                  <Subheading>{item.programRegistry.name}</Subheading>
                </StyledView>
              </RowView>
              <Subheading>{item.clinicalStatus?.name}</Subheading>
            </RowView>
          </StyledView>
        </ItemWrapper>
      )}
    ></FlatList>
  );
};
