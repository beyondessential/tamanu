import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import shortid from 'shortid';
import { connect } from 'react-redux';

import { foreignKey } from '../utils/validation';
import { encounterOptions } from '../constants';
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

function getEncounterTypeLabel(type) {
  return encounterOptions.find(x => x.value === type).label;
}

function getEncounterLabel(encounter) {
  const encounterDate = DateDisplay.rawFormat(encounter.startDate);
  const encounterTypeLabel = getEncounterTypeLabel(encounter.encounterType);
  return `${encounterDate} (${encounterTypeLabel})`;
}

function filterTestTypes(testTypes, conditions) {
  const { labTestCategoryId } = conditions;
  return labTestCategoryId
    ? testTypes.filter(tt => tt.labTestCategoryId === labTestCategoryId)
    : testTypes;
}

export class LabRequestForm extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onMount: PropTypes.func,
  };

  static defaultProps = {
    onMount: null,
  };

  componentDidMount() {
    const { onMount } = this.props;
    if (onMount) onMount();
  }

  renderForm = ({ values, submitForm }) => {
    const {
      practitionerSuggester,
      onCancel,
      testTypes,
      encounter = {},
      testCategories,
    } = this.props;
    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const encounterLabel = getEncounterLabel(encounter);
    const filteredTestTypes = filterTestTypes(testTypes, values);

    return (
      <FormGrid>
        <Field name="displayId" label="Lab request number" disabled component={TextField} />
        <Field name="requestedDate" label="Order date" required component={DateField} />
        <TextInput label="Supervising doctor" disabled value={examinerLabel} />
        <Field
          name="requestedById"
          label="Requesting doctor"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field name="sampleTime" label="Sample time" required component={DateTimeField} />
        <div>
          <Field name="specimenAttached" label="Specimen attached?" component={CheckField} />
          <Field name="urgent" label="Urgent?" component={CheckField} />
        </div>
        <FormSeparatorLine />
        <TextInput label="Encounter" disabled value={encounterLabel} />
        <Field
          name="labTestCategoryId"
          label="Lab request type"
          required
          component={SelectField}
          options={testCategories}
        />
        <Field
          name="labTestTypeIds"
          label="Tests"
          required
          testTypes={filteredTestTypes}
          component={TestSelectorField}
          style={{ gridColumn: '1 / -1' }}
        />
        <FormSeparatorLine />
        <Field
          name="note"
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
    const { onSubmit, editedObject, generateDisplayId } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          displayId: generateDisplayId(),
          requestedDate: new Date(),
          sampleTime: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          requestedById: foreignKey('Requesting doctor is required'),
          labTestCategoryId: foreignKey('Lab request type must be selected'),
          sampleTime: yup.date().required(),
          requestedDate: yup.date().required(),
        })}
        validate={values => {
          // there's a bug in formik for handling `yup.mixed.test` so just do it manually here
          const { labTestTypeIds = [] } = values;
          if (labTestTypeIds.length === 0) {
            return {
              labTestTypeIds: 'At least one test must be selected',
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
    testCategories: getLabTestCategories(state).map(({ id, name }) => ({
      value: id,
      label: name,
    })),
  }),
  dispatch => ({
    onMount: () => dispatch(loadOptions()),
  }),
)(LabRequestForm);
