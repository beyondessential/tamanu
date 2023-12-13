import { FullView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { groupBy } from 'lodash';
import React, { ReactElement } from 'react';
import { compose } from 'redux';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { PatientVaccineHistoryAccordion } from '~/ui/components/PatientVaccineHistoryAccordion';
import { withPatient } from '~/ui/containers/Patient';
import { useBackendEffect } from '~/ui/hooks';

export const VaccineScreenComponent = ({ selectedPatient }): ReactElement => {
  const [administeredVaccines, error] = useBackendEffect(
    ({ models }) => models.AdministeredVaccine.getForPatient(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;
  if (!administeredVaccines) return <LoadingScreen />;

  const dataGroupedByVaccine = Object.entries(
    groupBy(administeredVaccines, value => {
      if (typeof value.scheduledVaccine === 'string') {
        return value.scheduledVaccine;
      }
      return value.scheduledVaccine.vaccine.name;
    }),
  ).map(([title, data]) => ({ title, data }));
  if (error) return <ErrorScreen error={error} />;
  return (
    <StyledSafeAreaView flex={1}>
      <FullView background={theme.colors.BACKGROUND_GREY}>
        <PatientVaccineHistoryAccordion dataArray={dataGroupedByVaccine} />
      </FullView>
    </StyledSafeAreaView>
  );
};

export const VaccinesScreen = compose(withPatient)(VaccineScreenComponent);
