import React, { ReactElement } from 'react';
import { compose } from 'redux';
import { StyledView, RowView } from '/styled/common';
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

const PatientProgramRegistrySummary_ = ({ selectedPatient }): ReactElement => {
  const navigation = useNavigation();
  const { ability } = useAuth();
  const [programRegistries, programRegistryError, isProgramRegistryLoading] = useBackendEffect(
    async ({ models }) =>
      await models.ProgramRegistry.getProgramRegistriesForPatient(selectedPatient.id, ability),
    [],
  );

  if (isProgramRegistryLoading) return <LoadingScreen />;
  if (programRegistryError) return <ErrorScreen error={programRegistryError} />;

  return (
    <StyledView margin={20} borderRadius={5}>
      <RowView
        justifyContent="space-between"
        alignItems="center"
        background={theme.colors.WHITE}
        padding={20}
      >
        <SectionHeader h1 fontSize={14} fontWeight={500} color={theme.colors.TEXT_SUPER_DARK}>
          Program registry
        </SectionHeader>
        <Button
          backgroundColor={
            programRegistries?.length === 0 ? theme.colors.DISABLED_GREY : theme.colors.PRIMARY_MAIN
          }
          borderRadius={100}
          width={32}
          height={32}
          loadingAction={isProgramRegistryLoading}
          disabled={programRegistries?.length === 0}
          onPress={() => {
            navigation.navigate(Routes.HomeStack.PatientProgramRegistryFormStack.Index);
          }}
        >
          <CircleAdd size={32} />
        </Button>
      </RowView>
      <StyledView borderColor={theme.colors.BOX_OUTLINE} height={1} />
      {ability.can('list', 'PatientProgramRegistration') && (
        <StyledView paddingLeft={20} paddingRight={20} background={theme.colors.WHITE}>
          <PatientProgramRegistrationList selectedPatient={selectedPatient} />
        </StyledView>
      )}
    </StyledView>
  );
};

export const PatientProgramRegistrySummary = compose(withPatient)(PatientProgramRegistrySummary_);
