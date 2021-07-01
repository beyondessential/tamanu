import React from 'react';
import { connect } from 'react-redux';

import { getLabTestLaboratories } from '../store/options';

import { Form, Field, SelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

class ChangeLaboratoryForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { onCancel, laboratories } = this.props;
    return (
      <FormGrid columns={1}>
        <Field
          name="labTestLaboratoryId"
          label="Laboratory"
          component={SelectField}
          options={laboratories}
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
          laboratory: labRequest.laboratory,
        }}
        render={this.renderForm}
        onSubmit={onSubmit}
      />
    );
  }
}

export const ConnectedChangeLaboratoryForm = connect(state => ({
  laboratories: getLabTestLaboratories(state).map(({ id, name }) => ({
    value: id,
    label: name,
  })),
}))(ChangeLaboratoryForm);
