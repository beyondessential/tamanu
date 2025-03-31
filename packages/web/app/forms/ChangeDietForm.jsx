import React from 'react';
import PropTypes from 'prop-types';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Form, LocalisedField, SuggesterSelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ModalActionRow } from '../components';

export const ChangeDietForm = ({ onCancel, onSubmit, dietIds }) => {
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <LocalisedField
        name="dietIds"
        label={<TranslatedText
          stringId="general.localisedField.dietId.label"
          fallback="Diet"
          data-test-id='translatedtext-oug0' />}
        endpoint="diet"
        component={SuggesterSelectField}
        isMulti
        data-test-id='localisedfield-lh6s' />
      <ModalActionRow
        confirmText={<TranslatedText
          stringId="general.action.confirm"
          fallback="Confirm"
          data-test-id='translatedtext-ijfn' />}
        onConfirm={submitForm}
        onCancel={onCancel}
      />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
        dietIds,
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
