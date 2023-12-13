import { Button } from '/components/Button';
import { FilterIcon } from '/components/Icons';
import { FullView, StyledSafeAreaView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { IDiagnosis } from '~/types';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { PatientHistoryAccordion } from '~/ui/components/PatientHistoryAccordion';
import { withPatient } from '~/ui/containers/Patient';
import { NOTE_TYPES } from '~/ui/helpers/constants';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { useBackendEffect } from '~/ui/hooks';

const DEFAULT_FIELD_VAL = 'N/A';

const displayNotes = (notes): string =>
  notes
    .filter(note => note.noteType === NOTE_TYPES.CLINICAL_MOBILE)
    .map(note => note.content)
    .join('\n\n')
  || DEFAULT_FIELD_VAL;

const visitsHistoryRows = {
  labRequest: {
    name: 'Test results',
    accessor: (): string => DEFAULT_FIELD_VAL,
  },
  diagnoses: {
    name: 'Diagnosis',
    accessor: (diagnoses: IDiagnosis[]): string =>
      diagnoses.map(d => `${d.diagnosis?.name} (${d.certainty})`).join('\n\n')
      || DEFAULT_FIELD_VAL,
  },
  notes: {
    name: 'Clinical Note',
    accessor: displayNotes,
  },
};

const DumbVisitsScreen = ({ selectedPatient }): ReactElement => {
  const [data, error] = useBackendEffect(
    ({ models }) => models.Encounter.getForPatient(selectedPatient.id),
    [],
  );

  if (error) return <ErrorScreen error={error} />;

  return (
    <StyledSafeAreaView flex={1}>
      <FullView background={theme.colors.BACKGROUND_GREY}>
        {data ?
          <PatientHistoryAccordion dataArray={data} rows={visitsHistoryRows} /> :
          <LoadingScreen />}
      </FullView>
    </StyledSafeAreaView>
  );
};

export const VisitsScreen = compose(withPatient)(DumbVisitsScreen);
