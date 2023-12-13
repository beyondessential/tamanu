import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import React from 'react';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';

import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';

export const ChangeEncounterTypeForm = ({ onSubmit, onCancel, encounter, initialNewType }) => {
  return (
    <Form
      initialValues={{
        encounterType: initialNewType,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      render={({ submitForm, values }) => {
        const currentType = ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].label;
        const newType = ENCOUNTER_OPTIONS_BY_VALUE[values.encounterType].label;
        return (
          <FormGrid columns={1}>
            <div>
              <span>Changing encounter from</span>
              <b>{currentType}</b>
              <span>to</span>
              <b>{newType}</b>
            </div>
            <FormSubmitCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
          </FormGrid>
        );
      }}
      onSubmit={onSubmit}
    />
  );
};
