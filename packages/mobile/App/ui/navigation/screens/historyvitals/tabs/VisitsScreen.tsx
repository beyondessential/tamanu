import React, { ReactElement } from 'react';
import { compose } from 'redux';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { PatientHistoryAccordion } from '~/ui/components/PatientHistoryAccordion';
import { theme } from '/styled/theme';
import { NOTE_TYPES } from '~/ui/helpers/constants';
import { useBackendEffect } from '~/ui/hooks';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { withPatient } from '~/ui/containers/Patient';
import { IDiagnosis, INote } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';

const DEFAULT_FIELD_VAL = (
  <TranslatedText
    stringId="note.clinicalNote.default"
    fallback="Please note: Clinical notes may only be visible on desktop devices and the mobile device where the encounter occurred"
  />
);

const displayNotes = (notes: INote[]): string | Element =>
  notes
    .filter(note => note.noteTypeId === NOTE_TYPES.CLINICAL_MOBILE)
    .map(note => note.content)
    .join('\n\n') || DEFAULT_FIELD_VAL;

const visitsHistoryRows = {
  diagnoses: {
    name: <TranslatedText stringId="general.form.diagnosis.label" fallback="Diagnosis" />,
    accessor: (diagnoses: IDiagnosis[]) =>
      diagnoses.map((d, i) => (
        <>
          {i > 0 && '\n\n'}
          <TranslatedReferenceData
            key={d.id}
            category="diagnosis"
            value={d.diagnosis.id}
            fallback={d.diagnosis.name}
          />
          {` (${d.certainty})`} {/* TODO: translated enum */}
        </>
      )) || DEFAULT_FIELD_VAL,
  },
  notes: {
    name: <TranslatedText stringId="note.property.type.clinicalNote" fallback="Clinical Note" />,
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
        {data ? (
          <PatientHistoryAccordion dataArray={data} rows={visitsHistoryRows} />
        ) : (
          <LoadingScreen />
        )}
      </FullView>
    </StyledSafeAreaView>
  );
};

export const VisitsScreen = compose(withPatient)(DumbVisitsScreen);
