import React from 'react';
import styled from 'styled-components';

import {
  DateTimeInput,
  OuterLabelFieldWrapper,
  TextInput,
  TranslatedReferenceData,
  TranslatedText,
  useSettings,
} from '@tamanu/ui-components';
import { BodyText } from '../components';
import { DiagnosisList } from '../components/DiagnosisList';
import { Colors, PATIENT_STATUS } from '../constants';
import { getPatientStatus } from '../utils/getPatientStatus';

const StyledUnorderedList = styled.ul`
  margin: 5px 0;
  padding-left: 25px;
`;

const ProcedureList = React.memo(({ procedures }) => (
  <StyledUnorderedList data-testid="styledunorderedlist-g4mq">
    {procedures.length > 0 ? (
      procedures.map(({ procedureType }) => (
        <li key={procedureType.id}>
          <TranslatedReferenceData
            fallback={procedureType.name}
            value={procedureType.id}
            category={procedureType.type}
            data-testid={`translatedreferencedata-yta7-${procedureType.code}`}
          />
        </li>
      ))
    ) : (
      <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />
    )}
  </StyledUnorderedList>
));

export const EncounterOverview = ({
  encounter: { procedures, startDate, examiner, reasonForEncounter, encounterType },
  currentDiagnoses,
}) => {
  const { getSetting } = useSettings();
  const dischargeDiagnosisMandatory =
    getSetting('features.discharge.dischargeDiagnosisMandatory') &&
    getPatientStatus(encounterType) !== PATIENT_STATUS.OUTPATIENT;

  return (
    <>
      <DateTimeInput
        label={
          <TranslatedText stringId="discharge.admissionDate.label" fallback="Admission date" />
        }
        value={startDate}
        disabled
        data-testid="datetimeinput-4c61"
      />
      <TextInput
        label={
          <TranslatedText
            stringId="general.supervisingClinician.label"
            fallback="Supervising :clinician"
            replacements={{
              clinician: (
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  casing="lower"
                />
              ),
            }}
          />
        }
        value={examiner ? examiner.displayName : '-'}
        disabled
        data-testid="textinput-f322"
      />
      <TextInput
        label={
          <TranslatedText
            stringId="encounter.reasonForEncounter.label"
            fallback="Reason for encounter"
          />
        }
        value={reasonForEncounter}
        disabled
        style={{ gridColumn: '1 / -1' }}
        data-testid="textinput-11vp"
      />
      <OuterLabelFieldWrapper
        label={<TranslatedText stringId="general.diagnosis.label" fallback="Diagnosis" />}
        style={{ gridColumn: '1 / -1' }}
        data-testid="outerlabelfieldwrapper-2u7q"
      >
        {!currentDiagnoses.length && dischargeDiagnosisMandatory ? (
          <BodyText color={Colors.alert} data-testid="bodytext-lhri">
            <TranslatedText
              stringId="discharge.diagnosis.empty"
              fallback="No diagnosis recorded. A diagnosis must be recorded in order to finalise a discharge."
            />
          </BodyText>
        ) : (
          <DiagnosisList diagnoses={currentDiagnoses} data-testid="diagnosislist-ytbf" />
        )}
      </OuterLabelFieldWrapper>
      <OuterLabelFieldWrapper
        label={<TranslatedText stringId="discharge.procedures.label" fallback="Procedures" />}
        style={{ gridColumn: '1 / -1' }}
        data-testid="outerlabelfieldwrapper-qzw5"
      >
        <ProcedureList procedures={procedures} data-testid="procedurelist-m4o9" />
      </OuterLabelFieldWrapper>
    </>
  );
};
