import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  LocationField,
  TextField,
  TimeField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { foreignKey, optionalForeignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

const suggesterType = PropTypes.shape({
  fetchSuggestions: PropTypes.func,
  fetchCurrentOption: PropTypes.func,
});

export const ProcedureForm = React.memo(
  ({
    onCancel,
    onSubmit,
    editedObject,
    anaestheticSuggester,
    procedureSuggester,
    physicianSuggester,
    anaesthetistSuggester,
    assistantSuggester,
  }) => {
    const { currentUser } = useAuth();

    return (
      <Form
        onSubmit={onSubmit}
        render={({ submitForm, values }) => {
          const handleCancel = () => onCancel && onCancel();
          const getButtonText = (isCompleted) => {
            if (isCompleted)
              return (
                <TranslatedText
                  stringId="general.action.finalise"
                  fallback="Finalise"
                  data-testid="translatedtext-zya3"
                />
              );
            if (editedObject?.id)
              return (
                <TranslatedText
                  stringId="general.action.update"
                  fallback="Update"
                  data-testid="translatedtext-q6jp"
                />
              );
            return (
              <TranslatedText
                stringId="general.action.submit"
                fallback="Submit"
                data-testid="translatedtext-162m"
              />
            );
          };

          const isCompleted = !!values.completed;
          const buttonText = getButtonText(isCompleted);
          return (
            <div>
              <FormGrid data-testid="formgrid-6sdo">
                <div style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="procedureTypeId"
                    label={
                      <TranslatedText
                        stringId="procedure.procedureType.label"
                        fallback="Procedure"
                        data-testid="translatedtext-bgyt"
                      />
                    }
                    required
                    component={AutocompleteField}
                    suggester={procedureSuggester}
                    data-testid="field-87c2"
                  />
                </div>
                <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-mumm">
                  <Field
                    name="physicianId"
                    label={
                      <TranslatedText
                        stringId="general.localisedField.clinician.label.short"
                        fallback="Clinician"
                        data-testid="translatedtext-q0ge"
                      />
                    }
                    required
                    component={AutocompleteField}
                    suggester={physicianSuggester}
                    data-testid="field-lit6"
                  />
                  <Field
                    name="date"
                    label={
                      <TranslatedText
                        stringId="procedure.date.label"
                        fallback="Procedure date"
                        data-testid="translatedtext-11vd"
                      />
                    }
                    saveDateAsString
                    required
                    component={DateField}
                    data-testid="field-3a5v"
                  />
                  <Field
                    locationGroupLabel={
                      <TranslatedText
                        stringId="procedure.area.label"
                        fallback="Procedure area"
                        data-testid="translatedtext-n90i"
                      />
                    }
                    label={
                      <TranslatedText
                        stringId="procedure.location.label"
                        fallback="Procedure location"
                        data-testid="translatedtext-g854"
                      />
                    }
                    name="locationId"
                    enableLocationStatus={false}
                    required
                    component={LocationField}
                    data-testid="field-p4ef"
                  />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-8tii">
                  <Field
                    name="startTime"
                    label={
                      <TranslatedText
                        stringId="procedure.startTime.label"
                        fallback="Time started"
                        data-testid="translatedtext-cwjp"
                      />
                    }
                    component={TimeField}
                    saveDateAsString
                    data-testid="field-khml"
                  />
                  <Field
                    name="endTime"
                    label={
                      <TranslatedText
                        stringId="procedure.endTime.label"
                        fallback="Time ended"
                        data-testid="translatedtext-8agp"
                      />
                    }
                    component={TimeField}
                    saveDateAsString
                    data-testid="field-hgzz"
                  />
                </FormGrid>

                <Field
                  name="anaesthetistId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetist.label"
                      fallback="Anaesthetist"
                      data-testid="translatedtext-aka0"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaesthetistSuggester}
                  data-testid="field-96eg"
                />
                <Field
                  name="anaestheticId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetic.label"
                      fallback="Anaesthetic type"
                      data-testid="translatedtext-zy5k"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaestheticSuggester}
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                  data-testid="field-w9b5"
                />
                <Field
                  name="assistantId"
                  label={
                    <TranslatedText
                      stringId="procedure.assistant.label"
                      fallback="Assistant"
                      data-testid="translatedtext-vp0o"
                    />
                  }
                  component={AutocompleteField}
                  suggester={assistantSuggester}
                  data-testid="field-f3l4"
                />
                <Field
                  name="note"
                  label={
                    <TranslatedText
                      stringId="procedure.noteOrInstruction.label"
                      fallback="Notes or additional instructions"
                      data-testid="translatedtext-elx7"
                    />
                  }
                  component={TextField}
                  multiline
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                  data-testid="field-7en7"
                />
                <Field
                  name="completed"
                  label={
                    <TranslatedText
                      stringId="general.completed.label"
                      fallback="Completed"
                      data-testid="translatedtext-a0m2"
                    />
                  }
                  component={CheckField}
                  data-testid="field-uaz4"
                />
                <Collapse
                  in={isCompleted}
                  style={{ gridColumn: 'span 2' }}
                  data-testid="collapse-e9ow"
                >
                  <Field
                    name="completedNote"
                    label={
                      <TranslatedText
                        stringId="procedure.completedNote.label"
                        fallback="Notes on completed procedure"
                        data-testid="translatedtext-be1n"
                      />
                    }
                    component={TextField}
                    multiline
                    minRows={4}
                    data-testid="field-qrv7"
                  />
                </Collapse>
                <FormSubmitCancelRow
                  onCancel={handleCancel}
                  onConfirm={submitForm}
                  confirmText={buttonText}
                  data-testid="formsubmitcancelrow-8gtl"
                />
              </FormGrid>
            </div>
          );
        }}
        initialValues={{
          date: getCurrentDateTimeString(),
          startTime: getCurrentDateTimeString(),
          physicianId: currentUser.id,
          ...editedObject,
        }}
        formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          procedureTypeId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="procedure.procedureType.label"
              fallback="Procedure"
              data-testid="translatedtext-r5jo"
            />,
          ),
          locationId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.location.label"
              fallback="Location"
              data-testid="translatedtext-uh8z"
            />,
          ),
          date: yup
            .date()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="general.date.label"
                fallback="Date"
                data-testid="translatedtext-ni72"
              />,
            ),
          startTime: yup
            .date()
            .translatedLabel(
              <TranslatedText
                stringId="general.startTime.label"
                fallback="Start time"
                data-testid="translatedtext-sxek"
              />,
            ),
          endTime: yup.date(),
          physicianId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid="translatedtext-nour"
            />,
          ),
          assistantId: optionalForeignKey(),
          anaesthetistId: optionalForeignKey(),
          anaestheticId: optionalForeignKey(),
          note: yup.string(),
          completed: yup.boolean(),
          completedNote: yup.string(),
        })}
        data-testid="form-u2fq"
      />
    );
  },
);

ProcedureForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),

  anaestheticSuggester: suggesterType.isRequired,
  procedureSuggester: suggesterType.isRequired,
  physicianSuggester: suggesterType.isRequired,
  anaesthetistSuggester: suggesterType.isRequired,
  assistantSuggester: suggesterType.isRequired,
};

ProcedureForm.defaultProps = {
  editedObject: null,
};
