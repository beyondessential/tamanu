import { camelCase } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import shortid from 'shortid';
import * as yup from 'yup';

import { IMAGING_TYPES, FORM_TYPES, ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { FormSeparatorLine } from '../components';
import { FormSubmitDropdownButton } from '../components/DropdownButton';
import {
  MultiselectField,
  TextField,
  TranslatedSelectField,
  TextInput,
  Form,
  FormCancelButton,
  ButtonRow,
  FormGrid,
  useDateTime,
} from '@tamanu/ui-components';
import { AutocompleteField, DateTimeField, Field, ImagingPriorityField } from '../components/Field';
import { TranslatedReferenceData, TranslatedText } from '../components/Translation';
import { useEncounter } from '../contexts/Encounter';
import { useLocalisation } from '../contexts/Localisation';
import { useTranslation } from '../contexts/Translation';
import { reloadImagingRequest } from '../store';
import { useImagingRequestAreas } from '../utils/useImagingRequestAreas';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { foreignKey } from '../utils/validation';
import { useAuth } from '../contexts/Auth';

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
      label: (
        <TranslatedText
          stringId="general.action.finalise"
          fallback="Finalise"
          data-testid="translatedtext-mbt7"
        />
      ),
      onClick: finalise,
    },
    {
      label: (
        <TranslatedText
          stringId="general.action.finaliseAndPrint"
          fallback="Finalise & print"
          data-testid="translatedtext-sasd"
        />
      ),
      onClick: finaliseAndPrint,
    },
  ];

  return <FormSubmitDropdownButton actions={actions} data-testid="formsubmitdropdownbutton-57v3" />;
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
    const { formatShort, getCurrentDateTime } = useDateTime();
    const { getTranslation, getEnumTranslation } = useTranslation();
    const { getLocalisation } = useLocalisation();
    const { currentUser } = useAuth();

    const imagingTypes = getLocalisation('imagingTypes') || {};

    const { examiner = {} } = encounter;
    const examinerLabel = examiner.displayName;
    const { getAreasForImagingType } = useImagingRequestAreas();
    const requiredValidationMessage = getTranslation('validation.required.inline', '*Required');
    return (
      <Form
        onSubmit={onSubmit}
        initialValues={{
          displayId: generateId(),
          requestedDate: getCurrentDateTime(),
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
            <FormGrid data-testid="formgrid-4uzw">
              <Field
                name="displayId"
                label={
                  <TranslatedText
                    stringId="imaging.requestCode.label"
                    fallback="Imaging request code"
                    data-testid="translatedtext-69b8"
                  />
                }
                disabled
                component={TextField}
                data-testid="field-6jew"
              />
              <Field
                name="requestedDate"
                label={
                  <TranslatedText
                    stringId="imaging.requestedDate.label"
                    fallback="Order date and time"
                    data-testid="translatedtext-8yxf"
                  />
                }
                required
                component={DateTimeField}
                data-testid="field-xsta"
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
                          data-testid="translatedtext-3dwd"
                        />
                      ),
                    }}
                    data-testid="translatedtext-wvhl"
                  />
                }
                disabled
                value={examinerLabel}
                data-testid="textinput-3wnq"
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
                          data-testid="translatedtext-hdvw"
                        />
                      ),
                    }}
                    data-testid="translatedtext-z89m"
                  />
                }
                required
                component={AutocompleteField}
                suggester={practitionerSuggester}
                data-testid="field-g6kl"
              />
              <div>
                <ImagingPriorityField name="priority" data-testid="imagingpriorityfield-ra8l" />
              </div>
              <FormSeparatorLine data-testid="formseparatorline-lt2o" />
              <TextInput
                label={
                  <TranslatedText
                    stringId="imaging.encounter.label"
                    fallback="Encounter"
                    data-testid="translatedtext-wkk0"
                  />
                }
                disabled
                value={`${formatShort(encounter.startDate)} - ${getEnumTranslation(
                  ENCOUNTER_TYPE_LABELS,
                  encounter.encounterType,
                )}`}
                data-testid="textinput-tyem"
              />
              <Field
                name="imagingType"
                label={
                  <TranslatedText
                    stringId="imaging.imagingType.label"
                    fallback="Imaging request type"
                    data-testid="translatedtext-mmbd"
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
                data-testid="field-khld"
              />
              {imagingAreas.length > 0 ? (
                <Field
                  options={imagingAreas
                    .map(({ id, name, type, code }) => ({
                      label: (
                        <TranslatedReferenceData
                          fallback={name}
                          value={id}
                          category={type}
                          data-testid={`translatedreferencedata-50bn-${code}`}
                        />
                      ),
                      value: id,
                      searchString: getTranslation(getReferenceDataStringId(id, type), name),
                    }))
                    .sort((area1, area2) => {
                      return area1.searchString.localeCompare(area2.searchString);
                    })}
                  name="areas"
                  label={
                    <TranslatedText
                      stringId="imaging.areas.label"
                      fallback="Areas to be imaged"
                      data-testid="translatedtext-y92v"
                    />
                  }
                  component={MultiselectField}
                  prefix="imaging.property.area"
                  required
                  data-testid="field-bsn4"
                />
              ) : (
                <Field
                  name="areaNote"
                  label={
                    <TranslatedText
                      stringId="imaging.imagingNote.label"
                      fallback="Areas to be imaged"
                      data-testid="translatedtext-599j"
                    />
                  }
                  component={TextField}
                  multiline
                  style={{ gridColumn: '1 / -1' }}
                  minRows={3}
                  required
                  data-testid="field-r8tf"
                />
              )}
              <Field
                name="note"
                label={
                  <TranslatedText
                    stringId="general.notes.label"
                    fallback="Notes"
                    data-testid="translatedtext-0n6s"
                  />
                }
                component={TextField}
                multiline
                style={{ gridColumn: '1 / -1' }}
                minRows={3}
                data-testid="field-hhqc"
              />
              <ButtonRow data-testid="buttonrow-3y11">
                <FormCancelButton onClick={onCancel} data-testid="formcancelbutton-lr81">
                  <TranslatedText
                    stringId="general.action.cancel"
                    fallback="Cancel"
                    data-testid="translatedtext-c1ob"
                  />
                </FormCancelButton>
                <FormSubmitActionDropdown
                  encounter={encounter}
                  setOnSuccess={setOnSuccess}
                  submitForm={submitForm}
                  data-testid="formsubmitactiondropdown-ikqn"
                />
              </ButtonRow>
            </FormGrid>
          );
        }}
        data-testid="form-xktj"
      />
    );
  },
);

ImagingRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
