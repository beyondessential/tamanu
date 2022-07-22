import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { foreignKey } from '../utils/validation';
import { encounterOptions } from '../constants';
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
import { useSuggester } from '../api';

function getEncounterTypeLabel(type) {
  return encounterOptions.find(x => x.value === type).label;
}

function getEncounterLabel(encounter) {
  const encounterDate = DateDisplay.rawFormat(encounter.startDate);
  const encounterTypeLabel = getEncounterTypeLabel(encounter.encounterType);
  return `${encounterDate} (${encounterTypeLabel})`;
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

export const LabRequestForm = ({
  onSubmit,
  editedObject, 
  generateDisplayId,
  practitionerSuggester,
  onCancel,
  encounter = {},
  requestId,
}) => {

  /*
  // TODO: test types need to be filtered properly each time category changes
  // testTypes.filter(tt => tt.labTestCategoryId === labTestCategoryId)
  // and also it needs to fetch the whole lot for all of them? suggester/api update?

  previously it was doing this 
  (might just move this into a useState here instead of reworking the suggester):

    const labTestTypes = (await api.get(`labTest/options`)).data;
    const labTestCategories = (await api.get(`labTest/categories`)).data;
    const labTestPriorities = (await api.get(`labTest/priorities`)).data;
  
  */

  const testTypes = useSuggester('labTestType');
  const testCategories = useSuggester('labTestCategory');
  const testPriorities = useSuggester('labTestPriority');

  const renderForm = ({ values, submitForm }) => {
    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const encounterLabel = getEncounterLabel(encounter);
    const filteredTestTypes = filterTestTypes(testTypes, values);

    return (
      <FormGrid>
        <Field name="displayId" label="Lab request number" disabled component={TextField} />
        <Field name="requestedDate" label="Order date" required component={DateTimeField} />
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

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        displayId: generateDisplayId(),
        requestedDate: new Date().toLocaleDateString(),
        sampleTime: new Date().toLocaleString(),
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

LabRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
