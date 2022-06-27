import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { DateTimeField, Form, Field, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';

export class PatientCarePlanForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { editedObject, onCancel, practitionerSuggester, carePlanSuggester } = this.props;
    const buttonText = editedObject ? 'Save' : 'Add';
    return (
      <FormGrid columns={1}>
        <Field
          name="carePlanId"
          label="Care plan"
          component={AutocompleteField}
          suggester={carePlanSuggester}
          required
        />
        <FormGrid columns={2}>
          <Field name="date" label="Date recorded" component={DateTimeField} />
          <Field
            name="examinerId"
            label="Doctor/nurse"
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
        </FormGrid>
        <Field
          name="content"
          label="Main care plan"
          required
          component={TextField}
          multiline
          rows={6}
        />

        <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText={buttonText} />
      </FormGrid>
    );
  };

  render() {
    const { editedObject, onSubmit } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          date: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          carePlanId: foreignKey('Care plan is a required field'),
          date: yup.date(),
          examinerId: yup.string(),
          content: yup.string(),
        })}
      />
    );
  }
}

PatientCarePlanForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

PatientCarePlanForm.defaultProps = {
  editedObject: null,
};
