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
import { DateInput } from '../components/Field/DateField';
import { TextInput } from '../components/Field/TextField';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { DiagnosisList } from '../components/DiagnosisList';
import { useEncounter } from '../contexts/Encounter';

const ReadonlyFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 8px;
  margin-bottom: 1.2rem;

  ul {
    margin: 5px 0;
    padding-left: 25px;
  }
`;

const Label = styled.span`
  color: #666666;
  font-weight: 500;
`;

const EditFields = styled.div`
  display: grid;
  grid-template-columns: 100%;
  grid-row-gap: 1.2rem;
`;

const FullWidthFields = styled.div`
  grid-column: 1 / -1;

  > div:first-child {
    margin-bottom: 4px;
  }
`;

const ProcedureRow = ({ cpt }) => <li>{cpt}</li>;

const MedicineRow = ({ medication }) => (
  <li>
    {medication.medication.name} ({medication.prescription})
  </li>
);

const EncounterOverview = ({
  encounter: { medications, procedures, diagnoses, startDate, examiner, reasonForEncounter },
}) => (
  <ReadonlyFields>
    <DateInput label="Admission date" value={startDate} disabled />
    <TextInput
      label="Supervising Physician"
      value={examiner ? examiner.displayName : '-'}
      disabled
    />
    <div>
      <Label>Discharge medicines</Label>
      <ul>
        {medications.length > 0
          ? medications.map(m => <MedicineRow key={m} medication={m} />)
          : 'N/a'}
      </ul>
    </div>
    <div>
      <Label>Procedures</Label>
      <ul>
        {procedures.length > 0
          ? procedures.map(({ cptCode }) => <ProcedureRow key={cptCode} cpt={cptCode} />)
          : 'N/a'}
      </ul>
    </div>
    <FullWidthFields>
      <TextInput label="Reason for encounter" value={reasonForEncounter} disabled />
      <div>
        <Label>Diagnoses</Label>
        <DiagnosisList diagnoses={diagnoses} />
      </div>
    </FullWidthFields>
  </ReadonlyFields>
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

  console.log(dischargeNotes);
  const renderForm = ({ submitForm }) => {
    return (
      <div>
        <EncounterOverview encounter={encounter} />
        <EditFields>
          <Field name="endDate" label="Discharge date" component={DateField} required />
          <Field
            name="sendToPharmacy"
            label="Send discharge prescription to pharmacy"
            component={CheckField}
            helperText="Requires mSupply"
          />
          <Field
            name="discharge.dischargerId"
            label="Discharging physician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="discharge.note"
            label="Discharge treatment plan and follow-up notes"
            component={TextField}
            multiline
            rows={4}
          />
          <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText="Finalise" />
        </EditFields>
      </div>
    );
  };

  return (
    <div>
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
    </div>
  );
};
