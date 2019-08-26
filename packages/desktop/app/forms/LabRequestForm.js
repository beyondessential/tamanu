import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import styled from 'styled-components';
import shortid from 'shortid';

import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  DateField,
  SelectField,
  AutocompleteField,
  TextField,
  DateTimeField,
  CheckField,
} from '../components/Field';
import { TestSelectorField } from '../components/TestSelector';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { FormSeparatorLine } from '../components/FormSeparatorLine';

import { labRequestOptions } from '../constants';

const testTypes = {
  general: [
    { label: 'INR', value: 'inr' },
    { label: 'Blood Glucose', value: 'bloodglucose' },
    { label: 'Cholesterol', value: 'cholesterol' },
    { label: 'HbA1C', value: 'hba1c' },
    { label: 'CD4', value: 'cd4' },
    { label: 'Bilibubin', value: 'bili' },
    { label: 'ALP', value: 'alp' },
    { label: 'AST', value: 'ast' },
    { label: 'ALT', value: 'alt' },
    { label: 'GGT', value: 'ggt' },
    { label: 'Albumin', value: 'albumin' },
    { label: 'Prothrombin Time', value: 'prothro' },
    { label: 'Sodium', value: 'sodium' },
    { label: 'Potassium', value: 'potass' },
    { label: 'Chloride', value: 'chlor' },
    { label: 'Bicarbonate', value: 'bicarb' },
    { label: 'Urea', value: 'urea' },
    { label: 'Calcium', value: 'calci' },
    { label: 'Magnesium', value: 'magne' },
    { label: 'Phosphate', value: 'phosph' },
    { label: 'Creatinine', value: 'cratin' },
  ],
  microbiology: [
    { label: 'eGFR', value: 'egfr' },
    { label: 'HGB', value: 'hgb' },
    { label: 'WBC', value: 'wbc' },
    { label: 'PLT', value: 'plt' },
    { label: 'MCV', value: 'mcv' },
    { label: 'PCV', value: 'pcv' },
    { label: 'RBC', value: 'rbc' },
    { label: 'MCH', value: 'mch' },
    { label: 'MCHC', value: 'mchc' },
    { label: 'RDW-CV', value: 'rdw' },
    { label: 'Neutrophils', value: 'neutro' },
    { label: 'Lymphocytes', value: 'lympho' },
    { label: 'Monocytes', value: 'mono' },
    { label: 'Eosinophils', value: 'esin' },
    { label: 'Basophils', value: 'baso' },
  ],
  haematology: [],
  une: [],
};

export class LabRequestForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  renderForm = ({ values, submitForm }) => {
    const { practitionerSuggester } = this.props;
    return (
      <FormGrid>
        <Field name="_id" label="Lab request number" disabled component={TextField} />
        <Field name="orderDate" label="Order date" required component={DateField} />
        <Field
          name="supervisingDoctor._id"
          label="Supervising doctor"
          disabled
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="requestingDoctor._id"
          label="Requesting doctor"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="sampleTime"
          label="Sample time"
          required
          component={DateTimeField}
          suggester={practitionerSuggester}
        />
        <div>
          <Field name="specimenAttached" label="Specimen attached?" component={CheckField} />
          <Field name="urgent" label="Urgent?" component={CheckField} />
        </div>
        <FormSeparatorLine />
        <Field
          name="visit._id"
          label="Visit"
          disabled
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="labRequestType"
          label="Lab request type"
          required
          component={SelectField}
          options={labRequestOptions}
        />
        <Field
          name="tests"
          label="Tests"
          required
          tests={testTypes[values.labRequestType]}
          component={TestSelectorField}
          multiline
          style={{ gridColumn: '1 / -1' }}
          rows={3}
        />
        <FormSeparatorLine />
        <Field
          name="notes"
          label="Notes"
          component={TextField}
          multiline
          style={{ gridColumn: '1 / -1' }}
          rows={3}
        />
        <ButtonRow>
          <Button variant="contained">Cancel</Button>
          <Button variant="contained" onClick={submitForm} color="primary">
            Finalise and print
          </Button>
          <Button variant="contained" onClick={submitForm} color="primary">
            Finalise and close
          </Button>
        </ButtonRow>
      </FormGrid>
    );
  };

  render() {
    const { onSubmit, editedObject, generateId = shortid } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          _id: generateId(),
          orderDate: new Date(),
          labRequestType: 'general',
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          requestingDoctor: foreignKey('Requesting doctor is required'),
          sampleTime: yup.date().required(),
        })}
      />
    );
  }
}
