import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { DateTimeField, Form, Field, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';

export class PatientCarePlanForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    editedObject: PropTypes.shape({}),
  };

  renderForm = ({ submitForm }) => {
    const { editedObject, onCancel, practitionerSuggester, icd10Suggester } = this.props;
    const buttonText = editedObject ? 'Save' : 'Add';
    return (
      <FormGrid columns={1}>
        <Field
          name="diseaseId"
          label="Care Plan"
          component={AutocompleteField}
          suggester={icd10Suggester}
          required
        />
        <FormGrid columns={2}>
          <Field name="recordedDate" label="Date recorded" component={DateTimeField} />
          <Field
            name="examinerId"
            label="Doctor/Nurse"
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
        </FormGrid>
        <Field
          name="note"
          label="Main Care Plan"
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
    const { editedObject } = this.props;
    return (
      <Form
        onSubmit={this.props.onSubmit}
        render={this.renderForm}
        initialValues={{
          date: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          diseaseId: foreignKey('Care Plan is a required field'),
          date: yup.date(),
          authorId: yup.string(),
          note: yup.string(),
        })}
      />
    );
  }
}
