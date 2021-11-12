import React, { useState, useEffect } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useApi } from '../api';

import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  AutocompleteField,
  TextField,
  CheckField,
  DateField,
} from '../components/Field';
import { OuterLabelFieldWrapper } from '../components/Field/OuterLabelFieldWrapper';
import { DateInput } from '../components/Field/DateField';
import { TextInput } from '../components/Field/TextField';
import { FormGrid } from '../components/FormGrid';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { DiagnosisList } from '../components/DiagnosisList';
import { useEncounter } from '../contexts/Encounter';

const StyledUnorderedList = styled.ul`
  margin: 5px 0;
  padding-left: 25px;
`;

const MedicineRow = ({ medication }) => (
  <li>
    {medication.medication.name} ({medication.prescription})
  </li>
);

const EncounterOverview = ({
  encounter: { medications, procedures, diagnoses, startDate, examiner, reasonForEncounter },
}) => (
  <React.Fragment>
    <DateInput label="Admission date" value={startDate} disabled />
    <TextInput
      label="Supervising physician"
      value={examiner ? examiner.displayName : '-'}
      disabled
    />
    <TextInput
      label="Reason for encounter"
      value={reasonForEncounter}
      disabled
      style={{ gridColumn: '1 / -1' }}
    />
    <OuterLabelFieldWrapper label="Diagnoses" style={{ gridColumn: '1 / -1' }}>
      <DiagnosisList diagnoses={diagnoses} />
    </OuterLabelFieldWrapper>
    <OuterLabelFieldWrapper label="Procedures" style={{ gridColumn: '1 / -1' }}>
      <StyledUnorderedList>
        {procedures.length > 0
          ? procedures.map(({ cptCode }) => <li key={cptCode}>{cptCode}</li>)
          : 'N/a'}
      </StyledUnorderedList>
    </OuterLabelFieldWrapper>
  </React.Fragment>
);

export const DischargeForm = ({ practitionerSuggester, onCancel, onSubmit }) => {
  const { encounter } = useEncounter();
  const [dischargeNotes, setDischargeNotes] = useState([]);
  const api = useApi();

  useEffect(() => {
    (async () => {
      const { data: notes } = await api.get(`encounter/${encounter.id}/notes`);
      setDischargeNotes(notes.filter(n => n.noteType === 'discharge'));
    })();
  }, []);

  const renderForm = ({ submitForm }) => {
    return (
      <React.Fragment>
        <FormGrid>
          <EncounterOverview encounter={encounter} />
          <Field name="endDate" label="Discharge date" component={DateField} required />
          <Field
            name="discharge.dischargerId"
            label="Discharging physician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <OuterLabelFieldWrapper label="Discharge medicines" style={{ gridColumn: '1 / -1' }}>
            <StyledUnorderedList>
              {encounter.medications.length > 0
                ? encounter.medications.map(m => <MedicineRow key={m} medication={m} />)
                : 'N/a'}
            </StyledUnorderedList>
          </OuterLabelFieldWrapper>
          <Field
            name="sendToPharmacy"
            label="Send prescription to pharmacy"
            component={CheckField}
            helperText="Requires mSupply"
            style={{ gridColumn: '1 / -1' }}
          />
          <Field
            name="discharge.note"
            label="Discharge treatment plan and follow-up notes"
            component={TextField}
            multiline
            rows={4}
            style={{ gridColumn: '1 / -1' }}
          />
          <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText="Finalise" />
        </FormGrid>
      </React.Fragment>
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      enableReinitialize
      initialValues={{
        endDate: new Date(),
        discharge: {
          note: dischargeNotes.map(n => n.content).join('\n'),
        },
      }}
      validationSchema={yup.object().shape({
        endDate: yup.date().required(),
        discharge: yup
          .object()
          .shape({
            dischargerId: foreignKey('Discharging physician is a required field'),
          })
          .required(),
      })}
    />
  );
};
