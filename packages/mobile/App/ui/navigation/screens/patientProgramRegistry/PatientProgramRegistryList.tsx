import React, { ReactElement } from 'react';
import { RowView, StyledView } from '/styled/common';
import { Subheading } from 'react-native-paper';
import { FlatList, TouchableOpacity } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { theme } from '~/ui/styled/theme';
import { Routes } from '~/ui/helpers/routes';
import { useNavigation } from '@react-navigation/native';

const patientProgramRegistries = {
  data: [
    {
      id: 'patient_program_registry_id',
      programRegistryId: 'program_registry_id',
      programRegistry: {
        id: 'program_registry_id',
        name: 'Hepatitis B',
        program: {
          id: 'program_id',
          name: 'Hepatitis B',
        },
        currentlyAt: 'facility',
      },
      facilityId: 'Facility1',
      facility: {
        id: 'Facility1',
        name: 'Facility 1',
      },
      villageId: 'Village1',
      village: {
        id: 'Village1',
        name: 'Village 1',
      },
      patientDisplayId: '12341341',
      patientId: 'patient_id',
      patient: {
        id: 'patient_id',
        name: 'Tareq',
        firstName: 'Tareq',
        lastName: 'Aziz',
        dateOfBirth: '1989-11-09T02:40:16.237Z',
        village: 'Village 1',
        sex: 'M',
      },
      clinicianId: '213123',
      clinician: {
        id: '213123',
        displayName: 'Alaister',
      },
      registeringFacilityId: 'registering_facility_id',
      registeringFacility: {
        id: 'registering_facility_id',
        code: 'registring_facitlity',
        name: 'Hospital 1',
      },
      facitlityId: 'facitliId',
      clinicalStatusId: '1',
      clinicalStatus: {
        id: '1',
        code: 'low_risk',
        name: 'Low risk',
        color: 'green',
      },

      registrationStatus: 'active',
      date: '2023-08-28T02:40:16.237Z',
      // name: 'Hepatitis B',
      // registrationStatus: 'removed',
      removedById: '213123',
      dateRemoved: '2023-08-28T02:40:16.237Z',
      removedBy: {
        id: '213123',
        displayName: 'Alaister',
      },
      conditions: [
        { id: '1', name: 'Diabetes' },
        { id: '2', name: 'Hypertension' },
        { id: '3', name: 'Low pressure' },
        { id: '4', name: 'Migrain' },
        { id: '5', name: 'Joint pain' },
        { id: '6', name: 'Skin itching' },
        { id: '7', name: 'Tuberculosis of lung, bacteriologically and historically negative' },
      ],
    },
    {
      id: '1e25e8d1-a2b4-4bfa-9670-9f6b689e8afasd7',
      date: '2023-10-16 23:14:22',
      registrationStatus: 'removed',
      updatedAtSyncTick: '68824',
      createdAt: '2023-10-16T17:14:32.304Z',
      updatedAt: '2023-10-16T17:14:32.304Z',
      clinicianId: '90153d22-78e8-4ae9-8cfb-63c42946e833',
      patientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
      programRegistryId: 'programRegistry-HepatitisBProgramRegistry',
      clinicalStatusId: 'prClinicalStatus-LowRisk',
      facilityId: 'facility-ColonialWarMemorialDivisionalHospital',
      clinician: {
        id: '213123',
        displayName: 'Alaister',
      },
      clinicalStatus: {
        id: 'prClinicalStatus-LowRisk',
        code: 'Critical',
        name: 'Critical',
        color: 'red',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-26T06:53:03.872Z',
        updatedAt: '2023-09-26T06:53:03.872Z',
        programRegistryId: 'programRegistry-HepatitisBProgramRegistry',
      },
      programRegistry: {
        id: 'programRegistry-HepatitisBProgramRegistry',
        code: 'HepatitisBProgramRegistry',
        name: 'Covid 19',
        currentlyAtType: 'facility',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-26T06:53:03.814Z',
        updatedAt: '2023-09-26T06:53:03.814Z',
        programId: 'program-samoancdscreening',
      },
    },
  ],
};
export const PatientProgramRegistryList = ({ selectedPatient }): ReactElement => {
  const navigation = useNavigation();

  const onNavigateToPatientProgramRegistryDetails = (item: any) => {
    navigation.navigate(Routes.HomeStack.PatientProgramRegistryDetailsStack.Index, {
      patientProgramRegistry: item,
    });
  };

  return (
    <FlatList
      data={patientProgramRegistries.data}
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
              <Subheading>{item.clinicalStatus.name}</Subheading>
            </RowView>
          </StyledView>
        </TouchableOpacity>
      )}
    ></FlatList>
  );
};
