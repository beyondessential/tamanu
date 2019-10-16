import React from 'react';
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
import { ConfirmCancelRow } from '../components/ButtonRow';
import { DiagnosisList } from '../components/DiagnosisList';

const DisabledFields = styled.div`
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

const ReadonlyFields = () => {
  return (
    <DisabledFields>
      <Field name="admissionDate" label="Admission date" component={DateField} disabled />
      <Field
        name="supervisingPhysician"
        label="Supervising Physician"
        component={TextField}
        disabled
      />
      <div>
        <Label>Discharge medicines</Label>
        <ul>
          {visit.medications.map(m => (
            <MedicineRow key={m} medication={m} />
          ))}
        </ul>
      </div>
      <div>
        <Label>Procedures</Label>
        <ul>
          {visit.procedures.map(({ cptCode }) => (
            <ProcedureRow key={cptCode} cpt={cptCode} />
          ))}
        </ul>
      </div>
      <FullWidthFields>
        <Field name="reasonForVisit" label="Reason for visit" component={TextField} disabled />
        <div>
          <Label>Diagnoses</Label>
          <DiagnosisList diagnoses={visit.diagnoses} />
        </div>
      </FullWidthFields>
    </DisabledFields>
  );
};

export class DischargeForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    practitionerSuggester: PropTypes.shape({}).isRequired,
    visit: PropTypes.shape({}).isRequired,
  };

  renderForm = ({ submitForm }) => {
    const { practitionerSuggester, onCancel, visit } = this.props;
    return (
      <div>
        <EditFields>
          <Field name="endDate" label="Discharge date" component={DateField} required />
          <Field
            name="sendToPharmacy"
            label="Send discharge prescription to pharmacy"
            component={CheckField}
            helperText="Requires mSupply"
          />
          <Field
            name="dischargePhysician._id"
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

  render() {
    const { onSubmit, visit } = this.props;
    return (
      <div>
        <Form
          onSubmit={onSubmit}
          render={this.renderForm}
          initialValues={{
            admissionDate: visit.startDate,
            supervisingPhysician: visit.examiner.name,
            reasonForVisit: visit.reasonForVisit,
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
  }
}
