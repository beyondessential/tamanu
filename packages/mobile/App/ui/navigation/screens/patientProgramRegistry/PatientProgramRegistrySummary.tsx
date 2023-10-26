import React, { ReactElement } from 'react';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { theme } from '/styled/theme';
import { Button } from '~/ui/components/Button';
import { CircleAdd } from '~/ui/components/Icons';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '~/ui/helpers/routes';
import { PatientProgramRegistryList } from './PatientProgramRegistryList';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';

const PatientProgramRegistrySummary_ = ({ selectedPatient }): ReactElement => {
  const navigation = useNavigation();

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
          backgroundColor={theme.colors.PRIMARY_MAIN}
          borderRadius={100}
          width={32}
          height={32}
          onPress={() => {
            navigation.navigate(Routes.HomeStack.PatientProgramRegistryStack.Index);
          }}
        >
          <CircleAdd size={32} />
        </Button>
      </RowView>
      <StyledView borderColor={theme.colors.BOX_OUTLINE} height={1} />
      <StyledView
        paddingLeft={20}
        paddingRight={20}
        // paddingTop={10}
        // paddingBottom={10}
        background={theme.colors.WHITE}
      >
        <PatientProgramRegistryList selectedPatient={selectedPatient} />
      </StyledView>
    </StyledView>
  );
};

export const PatientProgramRegistrySummary = compose(withPatient)(PatientProgramRegistrySummary_);