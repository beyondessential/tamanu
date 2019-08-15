import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import {
  Form,
  Field,
  DateField,
  SelectField,
  AutocompleteField,
  TextField,
  NumberField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';

export class VitalsForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ submitForm }) => {
    const { locationSuggester, practitionerSuggester, editedObject, onCancel } = this.props;
    return (
      <FormGrid columns={1}>
        <Field
          name="dateRecorded"
          label="Date recorded"
          component={DateField}
        />
        <Field
          name="height"
          label="Height (cm)"
          component={NumberField}
        />
        <Field
          name="weight"
          label="Weight (kg)"
          component={NumberField}
        />
        <Field
          name="sbp"
          label="SBP"
          component={NumberField}
        />
        <Field
          name="dbp"
          label="DBP"
          component={NumberField}
        />
        <Field
          name="heartRate"
          label="Heart rate"
          component={NumberField}
        />
        <Field
          name="respiratoryRate"
          label="Respiratory rate"
          component={NumberField}
        />
        <Field
          name="temperature"
          label="Temperature (ºC)"
          component={NumberField}
        />
        <ButtonRow>
          <Button variant="contained" onClick={onCancel} color="">Cancel</Button>
          <Button variant="contained" onClick={submitForm} color="primary">Record</Button>
        </ButtonRow>
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
          dateRecorded: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
        })}
      />
    );
  }
}
