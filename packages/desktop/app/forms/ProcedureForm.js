import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import {
  Form,
  Field,
  DateField,
  TimeField,
  CheckField,
  AutocompleteField,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';

import { visitOptions } from '../constants';

export class ProcedureForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ submitForm }) => {
    const { 
      locationSuggester, 
      practitionerSuggester,
      cptCodeSuggester,
      anesthesiaSuggester,
      editedObject
    } = this.props;
    const buttonText = editedObject ? 'Update' : 'Create';
    return (
      <FormGrid>
        <Field
          name="procedure"
          label="Procedure"
          required
          component={TextField}
          helperText="Is this a dropdown or text or what?"
        />
        <Field
          name="cptCode"
          label="CPT Code"
          component={AutocompleteField}
          suggester={cptCodeSuggester}
        />
        <Field
          name="location"
          label="Location"
          required
          component={AutocompleteField}
          suggester={locationSuggester}
        />
        <FormGrid columns={3}>
          <Field
            name="date"
            label="Date"
            required
            component={DateField}
          />
          <Field
            name="startTime"
            label="Time Started"
            component={TimeField}
          />
          <Field
            name="endTime"
            label="Time Ended"
            component={TimeField}
          />
        </FormGrid>
        <Field
          name="physician"
          label="Physician"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="assistant"
          label="Assistant"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="anesthesiologist"
          label="Anesthesiologist"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="anesthesiaType"
          label="Anesthesia Type"
          component={AutocompleteField}
          suggester={anesthesiaSuggester}
          rows={4}
          style={{ gridColumn: 'span 2' }}
        />
        <Field
          name="notes"
          label="Notes"
          component={TextField}
          multiline
          rows={4}
          style={{ gridColumn: 'span 2' }}
        />
        <Field
          name="completed"
          label="Completed"
          component={CheckField}
        />
        <Field
          name="completedNotes"
          label="Notes on completed procedure"
          component={TextField}
          multiline
          rows={4}
          style={{ gridColumn: 'span 2' }}
        />
        <div style={{ gridColumn: 2, textAlign: 'right' }}>
          <Button variant="contained" onClick={submitForm} color="primary">
            {buttonText}
          </Button>
        </div>
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
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
        })}
      />
    );
  }
}
