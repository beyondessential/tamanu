import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { Form, Field, DateField, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export class AllergyForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    editedObject: PropTypes.shape({}),
  };

  static defaultProps = {
    editedObject: null,
  };

  renderForm = ({ submitForm }) => {
    const { editedObject, onCancel, practitionerSuggester } = this.props;
    const buttonText = editedObject ? 'Save' : 'Create';
    return (
      <FormGrid>
        <Field
          name="name"
          label="Allergy name"
          component={TextField}
          required
          style={{ gridColumn: 'span 2' }}
        />
        <Field name="date" label="Date recorded" component={DateField} />
        <Field
          name="practitioner"
          label="Doctor/Nurse"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="note" label="Notes" component={TextField} style={{ gridColumn: 'span 2' }} />
        <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} confirmText={buttonText} />
      </FormGrid>
    );
  };

  render() {
    const { onSubmit, editedObject } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          date: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          name: yup.string().required(),
        })}
      />
    );
  }
}
