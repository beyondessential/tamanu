import React, { ReactElement } from 'react';
import { RowView, StyledView } from '/styled/common';
import { Subheading } from 'react-native-paper';
import { FlatList, TouchableOpacity } from 'react-native';
import { Separator } from '~/ui/components/Separator';
import { theme } from '~/ui/styled/theme';

const patientProgramRegistries = {
  data: [
    {
      id: '1e25e8d1-a2b4-4bfa-9670-9f6b689e8af7',
      date: '2023-10-16 23:14:22',
      registrationStatus: 'active',
      updatedAtSyncTick: '68824',
      createdAt: '2023-10-16T17:14:32.304Z',
      updatedAt: '2023-10-16T17:14:32.304Z',
      clinicianId: '90153d22-78e8-4ae9-8cfb-63c42946e833',
      patientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
      programRegistryId: 'programRegistry-HepatitisBProgramRegistry',
      clinicalStatusId: 'prClinicalStatus-LowRisk',
      facilityId: 'facility-ColonialWarMemorialDivisionalHospital',
      clinicalStatus: {
        id: 'prClinicalStatus-LowRisk',
        code: 'LowRisk',
        name: 'Low risk',
        color: 'green',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-26T06:53:03.872Z',
        updatedAt: '2023-09-26T06:53:03.872Z',
        programRegistryId: 'programRegistry-HepatitisBProgramRegistry',
      },
      programRegistry: {
        id: 'programRegistry-HepatitisBProgramRegistry',
        code: 'HepatitisBProgramRegistry',
        name: 'Hepatitis B',
        currentlyAtType: 'facility',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-26T06:53:03.814Z',
        updatedAt: '2023-09-26T06:53:03.814Z',
        programId: 'program-samoancdscreening',
      },
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
  const onNavigateToPatientProgramRegistryDetails = () => {};

  return (
    <FlatList
      data={patientProgramRegistries.data}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={onNavigateToPatientProgramRegistryDetails}>
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
