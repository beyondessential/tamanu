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
import { DetailTable, DetailRow, FullWidthDetailRow } from '../components/DetailTable';
import { DateDisplay } from '../components/DateDisplay';
import { DiagnosisList } from '../components/DiagnosisView';

const DisabledFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 8px;
  margin-bottom: 1.2rem;
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

const Diagnoses = styled(DiagnosisList)`
  & > div {
    margin: 0;
  }
`;

const ProcedureRow = ({ cpt }) => <div>{cpt}</div>;

const MedicineRow = ({ drug, prescription }) => (
  <React.Fragment>
    <div>{drug}</div>
    <div>{prescription}</div>
  </React.Fragment>
);

const VisitOverview = React.memo(({ visit }) => (
  <DetailTable width="12rem">
    <FullWidthDetailRow label="Procedures">
      {visit.procedures.map(({ code }) => (
        <ProcedureRow key={code} cpt={code} />
      ))}
    </FullWidthDetailRow>
    <FullWidthDetailRow label="Discharge medicines">
      {visit.medications.map(m => (
        <MedicineRow key={m} icd10={m} />
      ))}
    </FullWidthDetailRow>
  </DetailTable>
));

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
        <DisabledFields>
          <Field name="admissionDate" label="Admission date" component={DateField} disabled />
          <Field
            name="supervisingPhysician"
            label="Supervising Physician"
            component={TextField}
            disabled
          />
          <FullWidthFields>
            <Field name="reasonForVisit" label="Reason for visit" component={TextField} disabled />
            <div>
              <span>Diagnoses</span>
              <Diagnoses diagnoses={visit.diagnoses} onEditDiagnosis={() => {}} />
            </div>
          </FullWidthFields>
        </DisabledFields>
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
        <VisitOverview visit={visit} />
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
