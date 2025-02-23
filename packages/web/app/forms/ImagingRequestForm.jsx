import { camelCase } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import shortid from 'shortid';
import * as yup from 'yup';

import { IMAGING_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { ButtonRow, DateDisplay, FormSeparatorLine } from '../components';
import { FormCancelButton } from '../components/Button';
import { FormSubmitDropdownButton } from '../components/DropdownButton';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  Form,
  ImagingPriorityField,
  MultiselectField,
  TextField,
  TextInput,
  TranslatedSelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import {
  TranslatedReferenceData,
  TranslatedText,
  getReferenceDataStringId,
} from '../components/Translation';
import { ENCOUNTER_OPTIONS, FORM_TYPES } from '../constants';
import { useEncounter } from '../contexts/Encounter';
import { useLocalisation } from '../contexts/Localisation';
import { useTranslation } from '../contexts/Translation';
import { reloadImagingRequest } from '../store';
import { useImagingRequestAreas } from '../utils/useImagingRequestAreas';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { foreignKey } from '../utils/validation';
import { useAuth } from '../contexts/Auth';

function getEncounterTypeLabel(type) {
  return ENCOUNTER_OPTIONS.find(x => x.value === type).label;
}

function getEncounterLabel(encounter) {
  const encounterDate = DateDisplay.stringFormat(encounter.startDate);
  const encounterTypeLabel = getEncounterTypeLabel(encounter.encounterType);
  return `${encounterDate} (${encounterTypeLabel})`;
}

const FormSubmitActionDropdown = React.memo(({ encounter, setOnSuccess, submitForm }) => {
  const { loadEncounter } = useEncounter();
  const dispatch = useDispatch();
  const { navigateToImagingRequest } = usePatientNavigation();

  const finalise = async data => {
    setOnSuccess(() => () => loadEncounter(encounter.id));
    await submitForm(data);
  };
  const finaliseAndPrint = async data => {
    setOnSuccess(() => async newRequest => {
      const requestId = newRequest.id;
      await dispatch(reloadImagingRequest(requestId));
      navigateToImagingRequest(requestId, 'print');
    });
    await submitForm(data);
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
    onSubmit,
    editedObject,
    generateId = shortid.generate,
    setOnSuccess,
  }) => {
    const { getTranslation } = useTranslation();
    const { getLocalisation } = useLocalisation();
    const { currentUser } = useAuth();

    const imagingTypes = getLocalisation('imagingTypes') || {};

    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const encounterLabel = getEncounterLabel(encounter);
    const { getAreasForImagingType } = useImagingRequestAreas();
    const requiredValidationMessage = getTranslation('validation.required.inline', '*Required');
    return (
      <Form
        onSubmit={onSubmit}
        initialValues={{
          displayId: generateId(),
          requestedDate: getCurrentDateTimeString(),
          requestedById: currentUser.id,
          ...editedObject,
        }}
        formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          requestedById: foreignKey(requiredValidationMessage),
          requestedDate: yup.date().required(requiredValidationMessage),
          imagingType: foreignKey(requiredValidationMessage),
          areas: yup.string().when('imagingType', {
            is: imagingType => {
              const imagingAreas = getAreasForImagingType(imagingType);
              return imagingAreas.length > 0;
            },
            then: yup
              .string()
              .min(3, requiredValidationMessage) // Empty input is '[]', so validating that it's got at least one value in the array
              .required(requiredValidationMessage),
          }),
          areaNote: yup.string().when('imagingType', {
            is: imagingType => {
              const imagingAreas = getAreasForImagingType(imagingType);
              return imagingAreas.length === 0;
            },
            then: yup
              .string()
              .trim()
              .required(requiredValidationMessage),
          }),
        })}
        showInlineErrorsOnly
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
                        <TranslatedText
                          stringId="general.localisedField.clinician.label.short"
                          fallback="Clinician"
                          casing="lower"
                        />
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
                        <TranslatedText
                          stringId="general.localisedField.clinician.label.short"
                          fallback="Clinician"
                          casing="lower"
                        />
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
                enumValues={IMAGING_TYPES}
                component={TranslatedSelectField}
                transformOptions={options => {
                  const availableTypes = Object.keys(imagingTypes);
                  return options
                    .filter(option => availableTypes.includes(camelCase(option.value)))
                    .map(option => {
                      const imagingTypeKey = camelCase(option.value);
                      const { label } = imagingTypes[imagingTypeKey];
                      return {
                        ...option,
                        value: imagingTypeKey,
                        label: getTranslation(option.label.stringId, label),
                      };
                    });
                }}
              />
              {imagingAreas.length > 0 ? (
                <Field
                  options={imagingAreas
                    .map(({ id, name, type }) => ({
                      label: <TranslatedReferenceData fallback={name} value={id} category={type} />,
                      value: id,
                      searchString: getTranslation(getReferenceDataStringId(id, type), name),
                    }))
                    .sort((area1, area2) => {
                      return area1.searchString.localeCompare(area2.searchString);
                    })}
                  name="areas"
                  label={
                    <TranslatedText stringId="imaging.areas.label" fallback="Areas to be imaged" />
                  }
                  component={MultiselectField}
                  prefix="imaging.property.area"
                  required
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
                  minRows={3}
                  required
                />
              )}
              <Field
                name="note"
                label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
                component={TextField}
                multiline
                style={{ gridColumn: '1 / -1' }}
                minRows={3}
              />
              <ButtonRow>
                <FormCancelButton onClick={onCancel}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </FormCancelButton>
                <FormSubmitActionDropdown
                  encounter={encounter}
                  setOnSuccess={setOnSuccess}
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
