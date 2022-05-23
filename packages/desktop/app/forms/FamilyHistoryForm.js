import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { Form, Field, DateField, AutocompleteField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';

export class FamilyHistoryForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { onCancel, icd10Suggester, practitionerSuggester, editedObject } = this.props;
    const buttonText = editedObject ? 'Save' : 'Add';
    return (
      <FormGrid columns={1}>
        <Field
          name="diagnosisId"
          label="Diagnosis"
          required
          component={AutocompleteField}
          suggester={icd10Suggester}
        />
        <Field name="date" label="Date recorded" required component={DateField} />
        <Field name="relationship" label="Relation to patient" component={TextField} />
        <Field
          name="practitionerId"
          label="Doctor/nurse"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="note" label="Notes" component={TextField} multiline rows={2} />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} confirmText={buttonText} />
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
          diagnosisId: foreignKey('Diagnosis is required'),
          practitionerId: foreignKey('Doctor/nurse is required'),
          date: yup.date().required(),
        })}
      />
    );
  }
}

FamilyHistoryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

FamilyHistoryForm.defaultProps = {
  editedObject: null,
};
