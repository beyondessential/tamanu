import React from 'react';
import PropTypes from 'prop-types';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { Form, LocalisedField, SuggesterSelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ModalActionRow } from '../components';

export const ChangeDietForm = ({ onCancel, onSubmit }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <LocalisedField
        name="dietId"
        label={
          <TranslatedText
            stringId="general.localisedField.dietId.label"
            fallback="Diet"
          />
        }
        endpoint="diet"
        component={SuggesterSelectField}
      />
      <ModalActionRow confirmText="Confirm" onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
        dietId: null,
      }}
      formType={FORM_TYPES.EDIT_FORM}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};

ChangeDietForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
