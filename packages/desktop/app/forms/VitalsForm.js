import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { Form, Field, DateField, NumberField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
export class VitalsForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ submitForm }) => {
    const { onCancel } = this.props;
    return (
      <FormGrid columns={2}>
        <Field name="dateRecorded" label="Date recorded" component={DateField} />
        <Field name="height" label="Height (cm)" component={NumberField} />
        <Field name="weight" label="Weight (kg)" component={NumberField} />
        <Field name="sbp" label="SBP" component={NumberField} />
        <Field name="dbp" label="DBP" component={NumberField} />
        <Field name="heartRate" label="Heart rate" component={NumberField} />
        <Field name="respiratoryRate" label="Respiratory rate" component={NumberField} />
        <Field name="temperature" label="Temperature (ºC)" component={NumberField} />
        <ConfirmCancelRow confirmText="Record" onConfirm={submitForm} onCancel={onCancel} />
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
          dateRecorded: yup.date().required(),
          height: yup.number(),
          weight: yup.number(),
          sbp: yup.number(),
          dbp: yup.number(),
          heartRate: yup.number(),
          respiratoryRate: yup.number(),
          temperature: yup.number(),
        })}
      />
    );
  }
}
