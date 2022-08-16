import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import shortid from 'shortid';

import { useDispatch } from 'react-redux';
import { foreignKey } from '../utils/validation';
import { encounterOptions } from '../constants';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useImagingRequestAreas } from '../utils/useImagingRequestAreas';
import { useLocalisation } from '../contexts/Localisation';

import {
  Form,
  Field,
  AutocompleteField,
  TextField,
  CheckField,
  TextInput,
  DateTimeField,
  MultiselectField,
  SelectField,
} from '../components/Field';
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
        navigateToImagingRequest(requestId, 'print');
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

  return <DropdownButton actions={actions} />;
});

export const ImagingRequestForm = React.memo(
  ({
    practitionerSuggester,
    onCancel,
    encounter = {},
    requestId,
    onSubmit,
    editedObject,
    generateId = shortid.generate,
  }) => {
    const { getLocalisation } = useLocalisation();
    const imagingTypes = getLocalisation('imagingTypes') || {};
    const imagingTypeOptions = Object.entries(imagingTypes).map(([key, val]) => ({
      label: val.label,
      value: key,
    }));

    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const encounterLabel = getEncounterLabel(encounter);
    const { getAreasForImagingType } = useImagingRequestAreas();
    return (
      <Form
        onSubmit={onSubmit}
        initialValues={{
          id: generateId(),
          requestedDate: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          requestedById: foreignKey('Requesting doctor is required'),
          requestedDate: yup.date().required(),
        })}
        render={({ submitForm, values }) => {
          const imagingAreas = getAreasForImagingType(values.imagingType);
          return (
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
                name="imagingType"
                label="Imaging request type"
                required
                component={SelectField}
                options={imagingTypeOptions}
              />
              {imagingAreas.length ? (
                <Field
                  options={imagingAreas.map(area => ({
                    label: area.name,
                    value: area.id,
                  }))}
                  name="areas"
                  label="Areas to be imaged"
                  component={MultiselectField}
                />
              ) : (
                <Field
                  name="areaNote"
                  label="Areas to be imaged"
                  component={TextField}
                  multiline
                  style={{ gridColumn: '1 / -1' }}
                  rows={3}
                />
              )}
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
        }}
      />
    );
  },
);

ImagingRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
