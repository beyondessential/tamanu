import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { Form, Field, DateField, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';

export class AllergyForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { editedObject, onCancel, practitionerSuggester, allergySuggester } = this.props;
    const buttonText = editedObject ? 'Save' : 'Add';
    return (
      <FormGrid columns={1}>
        <Field
          name="allergyId"
          label="Allergy name"
          component={AutocompleteField}
          suggester={allergySuggester}
          required
        />
        <Field name="date" label="Date recorded" component={DateField} required />
        <Field
          name="practitionerId"
          label="Doctor/nurse"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="note" label="Notes" component={TextField} />
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
          allergyId: foreignKey('An allergy must be selected'),
          date: yup.date().required(),
        })}
      />
    );
  }
}

AllergyForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

AllergyForm.defaultProps = {
  editedObject: null,
};
