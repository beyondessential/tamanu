import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { Form, Field, DateField, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';

export class FamilyHistoryForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ submitForm }) => {
    const { onClose, icd10Suggester, practitionerSuggester } = this.props;
    return (
      <FormGrid columns={1}>
        <Field
          name="diagnosis._id"
          label="Diagnosis"
          required
          component={AutocompleteField}
          suggester={icd10Suggester}
        />
        <Field name="date" label="Date recorded" required component={DateField} />
        <Field
          name="practitioner._id"
          label="Doctor/nurse"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="notes" label="Notes" component={TextField} multiline rows={2} />
        <ConfirmCancelRow variant="contained" onClick={submitForm} onCancel={onClose} />
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
          diagnosis: foreignKey('Diagnosis is required'),
          practitioner: foreignKey('Doctor/nurse is required'),
          date: yup.date().required(),
        })}
      />
    );
  }
}
