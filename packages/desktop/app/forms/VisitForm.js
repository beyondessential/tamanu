import React from 'react';
import {
  Form,
  Field,
  DateField,
  SelectField,
  TextField,
} from '../components/Field';
import { Button } from '../components/Button';

const visitTypes = [
  { label: "Admission", value: "admission" },
  { label: "Clinic", value: "clinic" },
  { label: "Imaging", value: "imaging" },
  { label: "Lab", value: "lab" },
  { label: "Emergency", value: "emergency" },
];

const locations = [
  { label: "Ward 1", value: "ward1" },
  { label: "Ward 2", value: "ward2" },
  { label: "Ward 3", value: "ward3" },
];

const practitioners = [
  { label: "Doctor 1", value: "doctor1" },
  { label: "Nurse 2", value: "nurse2" },
  { label: "Doctor 3", value: "doctor3" },
];

export class VisitForm extends React.PureComponent {

  renderForm = ({
    isValid,
    isSubmitting,
    submitForm,
  }) => (
    <React.Fragment>
      <Field
        name="startDate"
        label="Check-in"
        component={DateField}
        options={visitTypes}
      />
      <Field
        name="type"
        label="Visit type"
        component={SelectField}
        options={visitTypes}
      />
      <Field
        name="location"
        label="Location"
        component={SelectField}
        options={locations}
      />
      <Field
        name="practitioner"
        label="Practitioner"
        component={SelectField}
        options={practitioners}
      />
      <Field
        name="reasonForVisit"
        label="Reason for visit"
        component={TextField}
        multiline
        rows={4}
      />
      <Button onClick={submitForm}>Start visit</Button>
    </React.Fragment>
  );

  render() {
    const { onSubmit } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          startDate: new Date(),
        }}
      />
    );
  }

}
