import React from 'react';

import { Form, Field, SelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

const labStatuses = [
  { value: 'reception_pending', label: "Reception pending" },
  { value: 'results_pending', label: "Results pending" },
  { value: 'to_be_verified', label: "To be verified" },
  { value: 'verified', label: "Verified" },
  { value: 'published', label: "Published" },
];

export class ChangeLabStatusForm extends React.PureComponent {
  renderForm = ({ submitForm, values }) => {
    const { onCancel, labRequest } = this.props;
    const currentStatus = labRequest.status;
    return (
      <FormGrid columns={1}>
        <Field
          label="Status"
          name="status"
          component={SelectField}
          options={labStatuses}
        />
        <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { labRequest, onSubmit } = this.props;
    return (
      <Form
        initialValues={{
          ...labRequest,
        }}
        render={this.renderForm}
        onSubmit={onSubmit}
      />
    );
  }
}
