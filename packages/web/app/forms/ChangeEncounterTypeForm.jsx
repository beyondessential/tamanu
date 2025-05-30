import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { ENCOUNTER_OPTIONS_BY_VALUE, FORM_TYPES } from '../constants';

export const ChangeEncounterTypeForm = ({ onSubmit, onCancel, encounter, initialNewType }) => {
  return (
    <Form
      initialValues={{
        encounterType: initialNewType,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      formType={FORM_TYPES.EDIT_FORM}
      render={({ submitForm, values }) => {
        const currentType = ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].label;
        const newType = ENCOUNTER_OPTIONS_BY_VALUE[values.encounterType].label;
        return (
          <FormGrid columns={1} data-testid="formgrid-wphu">
            <div>
              <span>Changing encounter from </span>
              <b>{currentType}</b>
              <span> to </span>
              <b>{newType}</b>
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
