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

const Column = styled.div`
  display: grid;
  grid-row-gap: 1.2rem;

  > * {
    grid-column: 1 !important;
  }
`;

const DiagnosisRow = ({ diagnosis }) => <div>{diagnosis.name}</div>;

const ProcedureRow = ({ cpt }) => <div>{cpt}</div>;

const MedicineRow = ({ drug, prescription }) => (
  <React.Fragment>
    <div>{drug}</div>
    <div>{prescription}</div>
  </React.Fragment>
);

const VisitOverview = React.memo(({ visit }) => (
  <DetailTable width="12rem">
    <DetailRow label="Admission date">
      <DateDisplay date={visit.startDate} />
    </DetailRow>
    <DetailRow label="Supervising physician">{visit.examiner.name}</DetailRow>
    <DetailRow label="Reason for visit">{visit.reasonForVisit || 'Not specified'}</DetailRow>
    <FullWidthDetailRow label="Diagnoses">
      {visit.diagnoses.map(d => (
        <DiagnosisRow key={d._id} diagnosis={d.diagnosis} />
      ))}
    </FullWidthDetailRow>
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
    const { practitionerSuggester, onCancel } = this.props;
    return (
      <Column>
        <Field
          name="sendToPharmacy"
          label="Send discharge prescription to pharmacy"
          component={CheckField}
          helperText="Requires mSupply"
        />
        <Field name="endDate" label="Discharge date" component={DateField} required />
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
      </Column>
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
