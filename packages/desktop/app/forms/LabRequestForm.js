import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import shortid from 'shortid';
import { connect } from 'react-redux';

import { foreignKey } from '../utils/validation';
import { visitOptions } from '../constants';
import { getLabTestTypes, getLabTestCategories, loadOptions } from '../store/options';

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

function getVisitTypeLabel(type) {
  return visitOptions.find(x => x.value === type).label;
}

function getVisitLabel(visit) {
  const visitDate = DateDisplay.rawFormat(visit.startDate);
  const visitTypeLabel = getVisitTypeLabel(visit.visitType);
  return `${visitDate} (${visitTypeLabel})`;
}

export class LabRequestForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { onMount } = this.props;
    if (onMount) onMount();
  }

  renderForm = ({ values, submitForm }) => {
    const { practitionerSuggester, onCancel, testTypes, visit = {}, testCategories } = this.props;
    const { examiner = {} } = visit;
    const examinerLabel = examiner.displayName;
    const visitLabel = getVisitLabel(visit);
    const filteredTestTypes = testTypes.filter(x => x.category._id === values.labRequestType);

    return (
      <FormGrid>
        <Field name="_id" label="Lab request number" disabled component={TextField} />
        <Field name="requestedDate" label="Order date" required component={DateField} />
        <TextInput label="Supervising doctor" disabled value={examinerLabel} />
        <Field
          name="requestedBy._id"
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
          options={testCategories}
        />
        <Field
          name="testTypes"
          label="Tests"
          required
          testTypes={filteredTestTypes}
          component={TestSelectorField}
          style={{ gridColumn: '1 / -1' }}
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
          <Button variant="contained" onClick={onCancel}>
            Cancel
          </Button>
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
          labRequestType: '',
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          requestedBy: foreignKey('Requesting doctor is required'),
          sampleTime: yup.date().required(),
          labRequestType: yup.string().required(),
          requestedDate: yup.date().required(),
        })}
        validate={values => {
          // there's a bug in formik for handling `yup.mixed.test` so just do it manually here
          const { testTypes = {} } = values;
          if (Object.keys(testTypes).length === 0) {
            return {
              testTypes: 'At least one test must be selected',
            };
          }
          return {};
        }}
      />
    );
  }
}

export const ConnectedLabRequestForm = connect(
  state => ({
    testTypes: getLabTestTypes(state),
    testCategories: getLabTestCategories(state).map(({ _id, name }) => ({
      value: _id,
      label: name,
    })),
  }),
  dispatch => ({
    onMount: () => dispatch(loadOptions()),
  }),
)(LabRequestForm);
