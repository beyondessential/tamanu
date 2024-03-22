import React, { ReactElement } from 'react';
import { compose } from 'redux';
import styled from 'styled-components/native';
import { subject } from '@casl/ability';

import { StyledView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { theme } from '/styled/theme';
import { Button } from '~/ui/components/Button';
import { CircleAdd } from '~/ui/components/Icons';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '~/ui/helpers/routes';
import { PatientProgramRegistrationList } from './PatientProgramRegistrationList';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks/index';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useAuth } from '~/ui/contexts/AuthContext';

const Row = styled.View`
  flex-direction: row;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background-color: white;
  padding-vertical: 20px;
  padding-horizontal: 15px;
  justify-content: space-between;
  align-items: center;
`;

const PatientProgramRegistrySummary_ = ({ selectedPatient }): ReactElement => {
  const navigation = useNavigation();
  const { ability } = useAuth();
  const canListRegistrations = ability.can('list', 'PatientProgramRegistration');
  const canCreateRegistration = ability.can('create', 'PatientProgramRegistration');
  const [programRegistries, programRegistryError, isProgramRegistryLoading] = useBackendEffect(
    async ({ models }) => {
      if (canListRegistrations === false) return [];
      return await models.ProgramRegistry.getProgramRegistriesForPatient(selectedPatient.id);
    },
    [canListRegistrations, selectedPatient.id],
  );

  if (isProgramRegistryLoading) return <LoadingScreen />;
  if (programRegistryError) return <ErrorScreen error={programRegistryError} />;

  const accessibleRegistries = programRegistries.filter(r => ability.can('read', subject('ProgramRegistry', { id: r.id })));

  return (
    <StyledView margin={20} borderRadius={5}>
      <Row>
        <SectionHeader h1 fontSize={14} fontWeight={500} color={theme.colors.TEXT_SUPER_DARK}>
          Program registry
        </SectionHeader>
        {canCreateRegistration && (
          <Button
            backgroundColor={
              accessibleRegistries?.length === 0
                ? theme.colors.DISABLED_GREY
                : theme.colors.PRIMARY_MAIN
            }
            borderRadius={100}
            width={32}
            height={32}
            loadingAction={isProgramRegistryLoading}
            disabled={accessibleRegistries?.length === 0}
            onPress={() => {
              navigation.navigate(Routes.HomeStack.PatientProgramRegistryFormStack.Index);
            }}
          >
            <CircleAdd size={32} />
          </Button>
        )}
      </Row>
      <StyledView borderColor={theme.colors.BOX_OUTLINE} height={1} />
      {canListRegistrations && <PatientProgramRegistrationList selectedPatient={selectedPatient} />}
    </StyledView>
  );
};

export const PatientProgramRegistrySummary = compose(withPatient)(PatientProgramRegistrySummary_);
