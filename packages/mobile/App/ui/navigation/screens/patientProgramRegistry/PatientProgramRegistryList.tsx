import React, { ReactElement } from 'react';
import { RowView, StyledView } from '/styled/common';
import { Subheading } from 'react-native-paper';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { theme } from '~/ui/styled/theme';
import { Routes } from '~/ui/helpers/routes';
import { useNavigation } from '@react-navigation/native';
import { useBackendEffect } from '~/ui/hooks/index';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';

export const PatientProgramRegistryList = ({ selectedPatient }): ReactElement => {
  const navigation = useNavigation();
  const [registrations, registrationError, isRegistrationLoading] = useBackendEffect(
    async ({ models }) =>
      await models.PatientProgramRegistration.getMostRecentRegistrationsForPatient(
        selectedPatient.id,
      ),
    [],
  );
  if (isRegistrationLoading) return <LoadingScreen />;

  if (registrationError) return <ErrorScreen error={registrationError} />;

  const onNavigateToPatientProgramRegistryDetails = (item: any) => {
    navigation.navigate(Routes.HomeStack.PatientProgramRegistryDetailsStack.Index, {
      patientProgramRegistry: item,
    });
  };

  return (
    <FlatList
      data={registrations}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onNavigateToPatientProgramRegistryDetails(item)}>
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
                <Subheading>{item.programRegistry.name}</Subheading>
              </RowView>
              <Subheading>{item.clinicalStatus?.name}</Subheading>
            </RowView>
          </StyledView>
        </TouchableOpacity>
      )}
    ></FlatList>
  );
};
