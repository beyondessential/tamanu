import React from 'react';
import { ENCOUNTER_TYPE_LABELS, FORM_TYPES } from '@tamanu/constants';
import { Form, FormGrid, FormSubmitCancelRow, useDateTimeFormat } from '@tamanu/ui-components';

import { TranslatedText } from '../components/Translation/TranslatedText';
import { TranslatedEnum } from '../components/Translation/TranslatedEnum';


export const ChangeEncounterTypeForm = ({ onSubmit, onCancel, encounter, initialNewType }) => {
  const { getCurrentDateTimeString } = useDateTimeFormat();
  
  return (
    <Form
      initialValues={{
        encounterType: initialNewType,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      formType={FORM_TYPES.EDIT_FORM}
      render={({ submitForm, values }) => {
        return (
          <FormGrid columns={1} data-testid="formgrid-wphu">
            <div>
              <TranslatedText
                stringId="encounter.form.changeType.prefix"
                fallback="Changing encounter from"
                data-testid="translatedtext-change-prefix"
              />{' '}
              <b>
                <TranslatedEnum
                  value={encounter.encounterType}
                  enumValues={ENCOUNTER_TYPE_LABELS}
                  data-testid="translatedenum-current-type"
                />
              </b>{' '}
              <TranslatedText
                stringId="encounter.form.changeType.to"
                fallback="to"
                data-testid="translatedtext-change-to"
              />{' '}
              <b>
                <TranslatedEnum
                  value={values.encounterType}
                  enumValues={ENCOUNTER_TYPE_LABELS}
                  data-testid="translatedenum-new-type"
                />
              </b>
            </div>
            <FormSubmitCancelRow
              onConfirm={submitForm}
              confirmText="Save"
              onCancel={onCancel}
              data-testid="formsubmitcancelrow-9a54"
            />
          </FormGrid>
        );
      }}
      onSubmit={onSubmit}
      data-testid="form-z0pk"
    />
  );
};
