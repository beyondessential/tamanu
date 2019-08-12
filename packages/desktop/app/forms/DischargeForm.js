import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';

import {
  Form,
  Field,
  DateField,
  AutocompleteField,
  TextField,
  CheckField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { DetailTable, DetailRow } from '../components/DetailTable';
import { DateDisplay } from '../components/DateDisplay';

const Column = styled.div`
  display: grid;
  grid-row-gap: 1.2rem;

  > * {
    grid-column: 1 !important;
  }
`;

const VisitOverview = React.memo(({ visit }) => (
  <DetailTable>
    <DetailRow label="Admission date"><DateDisplay date={visit.startDate} /></DetailRow>
    <DetailRow label="Supervising physician">{visit.physician}</DetailRow>
    <DetailRow label="Reason for visit">{visit.reasonForVisit}</DetailRow>
    <DetailRow label="Diagnoses">{visit.physician}</DetailRow>
    <DetailRow label="Procedures">{visit.physician}</DetailRow>
    <DetailRow label="Discharge medicines">{visit.physician}</DetailRow>
  </DetailTable>
));

export class DischargeForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    practitionerSuggester: PropTypes.shape({}).isRequired,
    editedObject: PropTypes.shape({}).isRequired,
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
        <Field
          name="dischargePhysician"
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
        <ConfirmCancelRow
          style={{ gridColumn: 2 }}
          onCancel={onCancel}
          onConfirm={submitForm}
          confirmText="Finalise"
        />
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
            dischargeDate: new Date(),
          }}
          validationSchema={yup.object().shape({
            dischargePhysician: yup.string().required(),
            dischargeDate: yup.date().required(),
            dischargeNotes: yup.string(),
          })}
        />
      </div>
    );
  }
}
