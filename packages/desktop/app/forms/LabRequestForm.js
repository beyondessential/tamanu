import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { connect } from 'react-redux';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

import { foreignKey } from '../utils/validation';
import { encounterOptions } from '../constants';
import {
  getLabTestTypes,
  getLabTestCategories,
  getLabTestPriorities,
  loadOptions,
} from '../store/options';
import { useLabRequest } from '../contexts/LabRequest';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import {
  Form,
  Field,
  SelectField,
  AutocompleteField,
  TextField,
  DateTimeField,
  CheckField,
  TextInput,
} from '../components/Field';
import { TestSelectorField } from '../components/TestSelector';
import { FormGrid } from '../components/FormGrid';
import { OutlinedButton } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { DateDisplay } from '../components/DateDisplay';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { DropdownButton } from '../components/DropdownButton';

function getEncounterTypeLabel(type) {
  return encounterOptions.find(x => x.value === type).label;
}

function getEncounterLabel(encounter) {
  const encounterDate = DateDisplay.rawFormat(encounter.startDate);
  const encounterTypeLabel = getEncounterTypeLabel(encounter.encounterType);
  return `${encounterDate} (${encounterTypeLabel})`;
}

function filterTestTypes(testTypes, { labTestCategoryId }) {
  return labTestCategoryId
    ? testTypes.filter(tt => tt.labTestCategoryId === labTestCategoryId)
    : [];
}

const FormSubmitActionDropdown = ({ requestId, encounter, submitForm }) => {
  const { navigateToLabRequest } = usePatientNavigation();
  const { loadEncounter } = useEncounter();
  const { loadLabRequest } = useLabRequest();
  const [awaitingPrintRedirect, setAwaitingPrintRedirect] = useState();

  // Transition to print page as soon as we have the generated id
  useEffect(() => {
    (async () => {
      if (awaitingPrintRedirect && requestId) {
        await loadLabRequest(requestId);
        navigateToLabRequest(requestId, 'print');
      }
    })();
  }, [requestId, awaitingPrintRedirect, loadLabRequest, navigateToLabRequest]);

  const finalise = async data => {
    await submitForm(data);
    await loadEncounter(encounter.id);
  };
  const finaliseAndPrint = async data => {
    await submitForm(data);
    // We can't transition pages until the lab req is fully submitted
    setAwaitingPrintRedirect(true);
  };

  const actions = [
    { label: 'Finalise', onClick: finalise },
    { label: 'Finalise & print', onClick: finaliseAndPrint },
  ];

  return <DropdownButton actions={actions} />;
};

export class LabRequestForm extends React.PureComponent {
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
      testPriorities,
      requestId,
    } = this.props;
    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const encounterLabel = getEncounterLabel(encounter);
    const filteredTestTypes = filterTestTypes(testTypes, values);

    return (
      <FormGrid>
        <Field name="displayId" label="Lab request number" disabled component={TextField} />
        <Field
          name="requestedDate"
          label="Order date"
          required
          component={DateTimeField}
          saveDateAsString
        />
        <TextInput label="Supervising doctor" disabled value={examinerLabel} />
        <Field
          name="requestedById"
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
          saveDateAsString
        />
        <div>
          <Field name="specimenAttached" label="Specimen attached?" component={CheckField} />
          <Field name="urgent" label="Urgent?" component={CheckField} />
          <Field
            name="labTestPriorityId"
            label="Priority"
            component={SelectField}
            options={testPriorities}
          />
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
          <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
          <FormSubmitActionDropdown
            requestId={requestId}
            encounter={encounter}
            submitForm={submitForm}
          />
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
          requestedDate: getCurrentDateTimeString(),
          sampleTime: getCurrentDateTimeString(),
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

LabRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onMount: PropTypes.func,
};

LabRequestForm.defaultProps = {
  onMount: null,
};

export const ConnectedLabRequestForm = connect(
  state => ({
    testTypes: getLabTestTypes(state),
    testCategories: getLabTestCategories(state).map(({ id, name }) => ({
      value: id,
      label: name,
    })),
    testPriorities: getLabTestPriorities(state).map(({ id, name }) => ({
      value: id,
      label: name,
    })),
  }),
  dispatch => ({
    onMount: () => dispatch(loadOptions()),
  }),
)(LabRequestForm);
