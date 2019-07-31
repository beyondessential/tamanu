import React from 'react';
import PropTypes from 'prop-types'; 

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

const visitTypes = [
  { label: "Admission", value: "admission" },
  { label: "Clinic", value: "clinic" },
  { label: "Imaging", value: "imaging" },
  { label: "Lab", value: "lab" },
  { label: "Emergency", value: "emergency" },
];

export class VisitForm extends React.PureComponent {

  propTypes = {
    fetchLocations: PropTypes.func.isRequired,
    fetchPractitioners: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }

  renderForm = ({
    isValid,
    isSubmitting,
    submitForm,
  }) => {
    const { fetchLocations, fetchPractitioners } = this.props;
    return (
      <FormGrid>
        <Field
          name="type"
          label="Visit type"
          required
          component={SelectField}
          options={visitTypes}
        />
        <Field
          name="startDate"
          label="Check-in"
          required
          component={DateField}
          options={visitTypes}
        />
        <Field
          name="location"
          label="Location"
          required
          component={AutocompleteField}
          fetchOptions={fetchLocations}
        />
        <Field
          name="practitioner"
          label="Practitioner"
          required
          component={AutocompleteField}
          fetchOptions={fetchPractitioners}
        />
        <Field
          name="reasonForVisit"
          label="Reason for visit"
          component={TextField}
          multiline
          rows={4}
          style={{ gridColumn: "span 2" }}
        />
        <div style={{ gridColumn: 2, textAlign: "right" }}>
          <Button 
            variant="contained"
            onClick={submitForm}
            color="primary"
          >Start visit</Button>
        </div>
      </FormGrid>
    );
  }

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
