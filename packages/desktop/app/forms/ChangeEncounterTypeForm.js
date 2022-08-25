import React from 'react';

import { Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { useUrlSearchParams } from '../utils/useUrlSearchParams';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';

export const ChangeEncounterTypeForm = ({ onSubmit, onCancel, encounter }) => {
  const query = useUrlSearchParams();
  return (
    <Form
      initialValues={{
        encounterType: query.get('type'),
      }}
      render={({ submitForm, values }) => {
        const currentType = ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].label;
        const newType = ENCOUNTER_OPTIONS_BY_VALUE[values.encounterType].label;
        return (
          <FormGrid columns={1}>
            <div>
              <span>Changing encounter from </span>
              <b>{currentType}</b>
              <span> to </span>
              <b>{newType}</b>
            </div>
            <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
          </FormGrid>
        );
      }}
      onSubmit={onSubmit}
    />
  );
};
