import React from 'react';

import { Form, Field, AutocompleteField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export class ChangeDepartmentForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { onCancel, departmentSuggester } = this.props;
    return (
      <FormGrid columns={1}>
        <Field name="departmentId" component={AutocompleteField} suggester={departmentSuggester} />
        <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { onSubmit, encounter } = this.props;
    return (
      <Form
        initialValues={{
          departmentId: encounter.departmentId,
        }}
        render={this.renderForm}
        onSubmit={onSubmit}
      />
    );
  }
}
