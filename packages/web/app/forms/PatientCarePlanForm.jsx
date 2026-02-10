import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { TextField, Form, FormGrid, FormSubmitCancelRow, useDateTimeFormat } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { AutocompleteField, DateTimeField, Field } from '../components/Field';

import { foreignKey } from '../utils/validation';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../components/NoteModalActionBlocker';

export const PatientCarePlanForm = ({
  practitionerSuggester,
  carePlanSuggester,
  editedObject,
  onCancel,
  onSubmit,
}) => {
  const { getCurrentDateTime } = useDateTimeFormat();
  
  return (<Form
    onSubmit={onSubmit}
    render={({ submitForm }) => (
      <FormGrid columns={1} data-testid="formgrid-iwuf">
        <NoteModalActionBlocker>
          <Field
            name="carePlanId"
            label={
              <TranslatedText
                stringId="carePlan.plan.label"
                fallback="Care plan"
                data-testid="translatedtext-z102"
              />
            }
            component={AutocompleteField}
            suggester={carePlanSuggester}
            required
            data-testid="field-uc7w"
          />
          <FormGrid columns={2} data-testid="formgrid-0w31">
            <Field
              name="date"
              label={
                <TranslatedText
                  stringId="general.recordedDate.label"
                  fallback="Date recorded"
                  data-testid="translatedtext-anyg"
                />
              }
              component={DateTimeField}
              saveDateAsString
              data-testid="field-764k"
            />
            <Field
              name="examinerId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  data-testid="translatedtext-y4jt"
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-kb54"
            />
          </FormGrid>
          <Field
            name="content"
            label={
              <TranslatedText
                stringId="carePlan.content.label"
                fallback="Main care plan"
                data-testid="translatedtext-1chm"
              />
            }
            required
            component={TextField}
            multiline
            minRows={6}
            data-testid="field-0yjf"
          />
          <FormSubmitCancelRow
            onCancel={onCancel}
            onConfirm={submitForm}
            confirmText={
              editedObject ? (
                <TranslatedText
                  stringId="general.action.save"
                  fallback="Save"
                  data-testid="translatedtext-farf"
                />
              ) : (
                <TranslatedText
                  stringId="general.action.add"
                  fallback="Add"
                  data-testid="translatedtext-9kfy"
                />
              )
            }
            data-testid="formsubmitcancelrow-s3rl"
          />
        </NoteModalActionBlocker>
      </FormGrid>
    )}
    initialValues={{
      date: getCurrentDateTime(), 
      ...editedObject,
    }}
    formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    validationSchema={yup.object().shape({
      carePlanId: foreignKey().translatedLabel(
        <TranslatedText
          stringId="carePlan.plan.label"
          fallback="Care plan"
          data-testid="translatedtext-5683"
        />,
      ),
      date: yup.date(),
      examinerId: yup.string(),
      content: yup.string(),
    })}
    data-testid="form-3mv8"
  />);
};

PatientCarePlanForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

PatientCarePlanForm.defaultProps = {
  editedObject: null,
};
