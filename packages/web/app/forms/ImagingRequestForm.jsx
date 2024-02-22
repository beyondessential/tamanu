import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import shortid from 'shortid';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useDispatch } from 'react-redux';
import { foreignKey } from '../utils/validation';
import { ENCOUNTER_OPTIONS } from '../constants';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useLocalisation } from '../contexts/Localisation';
import { useImagingRequestAreas } from '../utils/useImagingRequestAreas';

import {
  AutocompleteField,
  DateTimeField,
  Field,
  Form,
  ImagingPriorityField,
  SelectField,
  TextField,
  TextInput,
  MultiselectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormCancelButton } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { DateDisplay } from '../components/DateDisplay';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { FormSubmitDropdownButton } from '../components/DropdownButton';
import { LowerCase } from '../components/Typography';
import { TranslatedText } from '../components/Translation/TranslatedText';

function getEncounterTypeLabel(type) {
  return ENCOUNTER_OPTIONS.find(x => x.value === type).label;
}

function getEncounterLabel(encounter) {
  const encounterDate = DateDisplay.stringFormat(encounter.startDate);
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
    {
      label: <TranslatedText stringId="general.action.finalise" fallback="Finalise" />,
      onClick: finalise,
    },
    {
      label: (
        <TranslatedText stringId="general.action.finaliseAndPrint" fallback="Finalise & print" />
      ),
      onClick: finaliseAndPrint,
    },
  ];

  return <FormSubmitDropdownButton actions={actions} />;
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
          displayId: generateId(),
          requestedDate: getCurrentDateTimeString(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          requestedById: foreignKey('Required'),
          requestedDate: yup.date().required(),
        })}
        render={({ submitForm, values }) => {
          const imagingAreas = getAreasForImagingType(values.imagingType);
          return (
            <FormGrid>
              <Field
                name="displayId"
                label={
                  <TranslatedText
                    stringId="imaging.requestCode.label"
                    fallback="Imaging request code"
                  />
                }
                disabled
                component={TextField}
              />
              <Field
                name="requestedDate"
                label={
                  <TranslatedText
                    stringId="imaging.requestedDate.label"
                    fallback="Order date and time"
                  />
                }
                required
                component={DateTimeField}
                saveDateAsString
              />
              <TextInput
                label={
                  <TranslatedText
                    stringId="general.supervisingClinician.label"
                    fallback="Supervising :clinician"
                    replacements={{
                      clinician: (
                        <LowerCase>
                          <TranslatedText
                            stringId="general.localisedField.clinician.label.short"
                            fallback="Clinician"
                          />
                        </LowerCase>
                      ),
                    }}
                  />
                }
                disabled
                value={examinerLabel}
              />
              <Field
                name="requestedById"
                label={
                  <TranslatedText
                    stringId="general.requestingClinician.label"
                    fallback="Requesting :clinician"
                    replacements={{
                      clinician: (
                        <LowerCase>
                          <TranslatedText
                            stringId="general.localisedField.clinician.label.short"
                            fallback="Clinician"
                          />
                        </LowerCase>
                      ),
                    }}
                  />
                }
                required
                component={AutocompleteField}
                suggester={practitionerSuggester}
              />
              <div>
                <ImagingPriorityField name="priority" />
              </div>
              <FormSeparatorLine />
              <TextInput
                label={<TranslatedText stringId="imaging.encounter.label" fallback="Encounter" />}
                disabled
                value={encounterLabel}
              />
              <Field
                name="imagingType"
                label={
                  <TranslatedText
                    stringId="imaging.imagingType.label"
                    fallback="Imaging request type"
                  />
                }
                required
                component={SelectField}
                options={imagingTypeOptions}
                prefix="imaging.property.type"
              />
              {imagingAreas.length ? (
                <Field
                  options={imagingAreas.map(area => ({
                    label: area.name,
                    value: area.id,
                  }))}
                  name="areas"
                  label={
                    <TranslatedText stringId="imaging.areas.label" fallback="Areas to be imaged" />
                  }
                  component={MultiselectField}
                  prefix="imaging.property.area"
                />
              ) : (
                <Field
                  name="areaNote"
                  label={
                    <TranslatedText
                      stringId="imaging.imagingNote.label"
                      fallback="Areas to be imaged"
                    />
                  }
                  component={TextField}
                  multiline
                  style={{ gridColumn: '1 / -1' }}
                  rows={3}
                />
              )}
              <Field
                name="note"
                label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
                component={TextField}
                multiline
                style={{ gridColumn: '1 / -1' }}
                rows={3}
              />
              <ButtonRow>
                <FormCancelButton onClick={onCancel}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </FormCancelButton>
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
