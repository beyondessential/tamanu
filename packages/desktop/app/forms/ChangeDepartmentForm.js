import React from 'react';

import { Form, Field, AutocompleteField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export class ChangeDepartmentForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { onCancel, visit, departmentSuggester } = this.props;
    return (
      <FormGrid columns={1}>
        <Field
          name="department._id"
          component={AutocompleteField}
          suggester={departmentSuggester}
        />
        <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { onSubmit, visit } = this.props;
    return (
      <Form
        initialValues={{
          department: visit.department,
        }}
        render={this.renderForm}
        onSubmit={onSubmit}
      />
    );
  }
}
