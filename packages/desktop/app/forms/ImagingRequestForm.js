import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import shortid from 'shortid';
import { useDispatch } from 'react-redux';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';

import { foreignKey } from '../utils/validation';
import { encounterOptions } from '../constants';
import { reloadImagingRequest } from '../store';

import {
  Form,
  Field,
  AutocompleteField,
  TextField,
  CheckField,
  TextInput,
  DateTimeField,
} from '../components/Field';
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

const FormSubmitActionDropdown = React.memo(({ requestId, encounter, submitForm }) => {
  const dispatch = useDispatch();
  const { loadEncounter } = useEncounter();
  const { navigateToImagingRequest } = usePatientNavigation();
  const [awaitingPrintRedirect, setAwaitingPrintRedirect] = useState();

  // Transition to print page as soon as we have the generated id
  useEffect(() => {
    (async () => {
      if (awaitingPrintRedirect && requestId) {
        await dispatch(reloadImagingRequest(requestId));
        navigateToImagingRequest(requestId);
      }
    })();
  }, [requestId, awaitingPrintRedirect, dispatch, navigateToImagingRequest]);

  const finalise = async data => {
    await submitForm(data);
    await loadEncounter(encounter.id);
  };

  const finaliseAndPrint = async data => {
    await submitForm(data);
    // We can't transition pages until the imaging req is fully submitted
    setAwaitingPrintRedirect(true);
  };

  const actions = [
    { label: 'Finalise', onClick: finalise },
    { label: 'Finalise & print', onClick: finaliseAndPrint },
  ];

  return <DropdownButton variant="contained" actions={actions} />;
});

export const ImagingRequestForm = ({ 
  onSubmit,
  editedObject,
  generateId = shortid.generate,
  onCancel,
  encounter = {},
  requestId,
}) => {
  
  const { examiner = {} } = encounter;
  const examinerLabel = examiner.displayName;
  const encounterLabel = getEncounterLabel(encounter);
  const practitionerSuggester = useSuggester('practitioner');
  const imagingTypeSuggester = useSuggester('imagingType');

  const renderForm = ({ submitForm }) => (
    <FormGrid>
      <Field name="id" label="Imaging request code" disabled component={TextField} />
      <Field
        name="requestedDate"
        label="Order date and time"
        required
        component={DateTimeField}
      />
      <TextInput label="Supervising doctor" disabled value={examinerLabel} />
      <Field
        name="requestedById"
        label="Requesting doctor"
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
      <div>
        <Field name="urgent" label="Urgent?" component={CheckField} />
      </div>
      <FormSeparatorLine />
      <TextInput label="Encounter" disabled value={encounterLabel} />
      <Field
        name="imagingTypeId"
        label="Imaging request type"
        required
        component={AutocompleteField}
        suggester={imagingTypeSuggester}
      />
      <Field
        name="areaToBeImaged"
        label="Area to be imaged"
        component={TextField}
        multiline
        style={{ gridColumn: '1 / -1' }}
        rows={3}
      />
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

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        id: generateId(),
        requestedDate: new Date(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        requestedById: foreignKey('Requesting doctor is required'),
        imagingTypeId: foreignKey('Imaging request type must be selected'),
        requestedDate: yup.date().required(),
      })}
    />
  );
};

ImagingRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
