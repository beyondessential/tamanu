import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import {
  Form,
  Field,
  DateField,
  TimeField,
  CheckField,
  AutocompleteField,
  TextField,
} from '../components/Field';
import { Button } from '../components/Button';
import { FormGrid } from '../components/FormGrid';
import { ButtonRow } from '../components/ButtonRow';

export class OngoingConditionForm extends React.PureComponent {
  
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    editedObject: PropTypes.shape({}),
  };

  static defaultProps = {
    editedObject: null,
  };

  renderForm = ({ submitForm, values, setFieldValue }) => {
    const {
      editedObject,
      onCancel,
      practitionerSuggester,
    } = this.props;
    const resolving = values.resolved;
    const buttonText = editedObject ? "Save" : "Create";
    return (
      <FormGrid>
        <Field
          name="name"
          label="Name"
          component={TextField}
          required
          style={{ gridColumn: 'span 2' }}
        />
        <Field
          name="date"
          label="Date recorded"
          component={DateField}
        />
        <Field
          name="practitioner"
          label="Doctor/Nurse"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="note"
          label="Notes"
          component={TextField}
          style={{ gridColumn: 'span 2' }}
        />
        <Collapse in={resolving} style={{ gridColumn: 'span 2' }}>
          <FormGrid>
            <Field
              name="resolutionDate"
              label="Date resolved"
              component={DateField}
            />
            <Field
              name="resolutionPractitioner"
              label="Doctor/Nurse confirming resolution"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="resolutionNote"
              label="Notes"
              component={TextField}
              style={{ gridColumn: 'span 2' }}
            />
          </FormGrid>
        </Collapse>
        <ButtonRow style={{ gridColumn: 'span 2' }}>
          <Button variant="contained" onClick={onCancel}>Close</Button>
          <Button 
            variant="contained"
            color="secondary" 
            onClick={()=>setFieldValue('resolved', true)}
            disabled={resolving}
          >Resolve</Button>
          <Button variant="contained" color="primary" onClick={submitForm}>Update</Button>
        </ButtonRow>
      </FormGrid>
    );
  };

  stripResolutionData(data) {
    if(data.resolved) {
      return data;
    }

    const { 
      resolutionDate, 
      resolutionNote,
      resolutionPractitioner,
      ...rest
    } = data;
    return rest;
  }

  onSubmit = (data) => {
    const { onSubmit } = this.props;
    onSubmit(this.stripResolutionData(data));
  };

  render() {
    const { editedObject } = this.props;
    return (
      <Form
        onSubmit={this.onSubmit}
        render={this.renderForm}
        initialValues={{
          date: new Date(),
          resolutionDate: new Date(),
          resolved: false,
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          name: yup.string().required(),
          date: yup.date(),
          practitioner: yup.string(),
          note: yup.string(),

          resolved: yup.boolean(),
          resolutionDate: yup.string(),
          resolutionPractitioner: yup.string(),
          resolutionNote: yup.string(),
        })}
      />
    );
  }
}
