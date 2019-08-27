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
    { name: 'INR', _id: 'inr' },
    { name: 'Blood Glucose', _id: 'bloodglucose' },
    { name: 'Cholesterol', _id: 'cholesterol' },
    { name: 'HbA1C', _id: 'hba1c' },
    { name: 'CD4', _id: 'cd4' },
    { name: 'Bilibubin', _id: 'bili' },
    { name: 'ALP', _id: 'alp' },
    { name: 'AST', _id: 'ast' },
    { name: 'ALT', _id: 'alt' },
    { name: 'GGT', _id: 'ggt' },
    { name: 'Albumin', _id: 'albumin' },
    { name: 'Prothrombin Time', _id: 'prothro' },
    { name: 'Sodium', _id: 'sodium' },
    { name: 'Potassium', _id: 'potass' },
    { name: 'Chloride', _id: 'chlor' },
    { name: 'Bicarbonate', _id: 'bicarb' },
    { name: 'Urea', _id: 'urea' },
    { name: 'Calcium', _id: 'calci' },
    { name: 'Magnesium', _id: 'magne' },
    { name: 'Phosphate', _id: 'phosph' },
    { name: 'Creatinine', _id: 'cratin' },
  ],
  microbiology: [
    { name: 'eGFR', _id: 'egfr' },
    { name: 'HGB', _id: 'hgb' },
    { name: 'WBC', _id: 'wbc' },
    { name: 'PLT', _id: 'plt' },
    { name: 'MCV', _id: 'mcv' },
    { name: 'PCV', _id: 'pcv' },
    { name: 'RBC', _id: 'rbc' },
    { name: 'MCH', _id: 'mch' },
    { name: 'MCHC', _id: 'mchc' },
    { name: 'RDW-CV', _id: 'rdw' },
    { name: 'Neutrophils', _id: 'neutro' },
    { name: 'Lymphocytes', _id: 'lympho' },
    { name: 'Monocytes', _id: 'mono' },
    { name: 'Eosinophils', _id: 'esin' },
    { name: 'Basophils', _id: 'baso' },
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
          testTypes={testTypes[values.labRequestType]}
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
