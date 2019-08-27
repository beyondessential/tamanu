import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
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
  TextInput,
} from '../components/Field';
import { TestSelectorField } from '../components/TestSelector';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { DateDisplay } from '../components/DateDisplay';
import { FormSeparatorLine } from '../components/FormSeparatorLine';

import { labRequestOptions, visitOptions } from '../constants';

function getVisitTypeLabel(type) {
  return visitOptions.find(x => x.value === type).label;
}

function getVisitLabel(visit) {
  const visitDate = DateDisplay.rawFormat(visit.startDate);
  const visitTypeLabel = getVisitTypeLabel(visit.visitType);
  return `${visitDate} (${visitTypeLabel})`;
}

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
    const { practitionerSuggester, onCancel, visit = {} } = this.props;
    const { examiner = {} } = visit;
    const examinerLabel = examiner.displayName;
    const visitLabel = getVisitLabel(visit);
    return (
      <FormGrid>
        <Field name="_id" label="Lab request number" disabled component={TextField} />
        <Field name="requestedDate" label="Order date" required component={DateField} />
        <TextInput label="Supervising doctor" disabled value={examinerLabel} />
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
        <TextInput label="Visit" disabled value={visitLabel} />
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
          <Button variant="contained" onClick={onCancel}>Cancel</Button>
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
          requestedDate: new Date(),
          labRequestType: 'general',
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          requestingDoctor: foreignKey('Requesting doctor is required'),
          sampleTime: yup.date().required(),
          labRequestType: yup.string().required(),
          requestedDate: yup.date().required(),
        })}
        validate={values => {
          // there's a bug in formik for handling `yup.mixed.test` so just do it manually here
          const { tests = {} } = values;
          if (Object.keys(tests).length === 0) {
            return {
              tests: 'At least one test must be selected',
            };
          }
          return {};
        }}
      />
    );
  }
}
