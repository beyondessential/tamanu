import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';

import {
  Form,
  Field,
  DateField,
  SelectField,
  AutocompleteField,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { foreignKey } from '../utils/validation';
import { visitOptions } from '../constants';

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
        <Field
          name="date"
          label="Date recorded"
          required
          component={DateField}
        />
        <Field
          name="examiner._id"
          label="Doctor/nurse"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="notes"
          label="Notes"
          component={TextField}
          multiline
          rows={2}
        />
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
          examiner: foreignKey('Examiner is required'),
          date: yup.date().required(),
        })}
      />
    );
  }
}
