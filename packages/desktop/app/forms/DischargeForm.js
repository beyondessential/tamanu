import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';

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
import { connectApi } from '../api';

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
  <React.Fragment>
    <li>
      {medication.drug.name} ({medication.prescription})
    </li>
  </React.Fragment>
);

const EncounterOverview = ({ encounter, medications, procedures, diagnoses }) => (
  <ReadonlyFields>
    <DateInput label="Admission date" value={encounter.startDate} disabled />
    <TextInput
      label="Supervising Physician"
      value={encounter.examiner ? encounter.examiner.displayName : '-'}
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
      <TextInput label="Reason for encounter" value={encounter.reasonForEncounter} disabled />
      <div>
        <Label>Diagnoses</Label>
        <DiagnosisList diagnoses={diagnoses} />
      </div>
    </FullWidthFields>
  </ReadonlyFields>
);

const DumbDischargeForm = ({
  practitionerSuggester,
  onCancel,
  onSubmit,
  encounter,
  onFetchDiagnoses,
  onFetchMedications,
  onFetchProcedures,
}) => {
  const [procedures, setProcedures] = useState([]);
  const [medications, setMedications] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  useEffect(() => {
    async function fetchEncounterData() {
      const procedure = await onFetchProcedures();
      setProcedures(procedure.data);

      const medication = await onFetchMedications();
      setMedications(medication.data);

      const diagnosis = await onFetchDiagnoses();
      setDiagnoses(diagnosis.data);
    }
    fetchEncounterData();
  }, [encounter]);

  const renderForm = ({ submitForm }) => {
    return (
      <div>
        <EncounterOverview
          encounter={encounter}
          medications={medications}
          procedures={procedures}
          diagnoses={diagnoses}
        />
        <EditFields>
          <Field name="endDate" label="Discharge date" component={DateField} required />
          <Field
            name="sendToPharmacy"
            label="Send discharge prescription to pharmacy"
            component={CheckField}
            helperText="Requires mSupply"
          />
          <Field
            name="dischargePhysician.id"
            label="Discharging physician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="dischargeNotes"
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
        initialValues={{
          endDate: new Date(),
        }}
        validationSchema={yup.object().shape({
          endDate: yup.date().required(),
          dischargePhysician: foreignKey('Discharging physician is a required field'),
          dischargeNotes: yup.string(),
        })}
      />
    </div>
  );
};

export const DischargeForm = connectApi((api, dispatch, { encounter }) => ({
  onFetchDiagnoses: async () => api.get(`encounter/${encounter.id}/diagnoses`),
  onFetchProcedures: async () => api.get(`encounter/${encounter.id}/procedures`),
  onFetchMedications: async () => api.get(`encounter/${encounter.id}/medications`),
}))(DumbDischargeForm);
