import React from 'react';
import PropTypes from 'prop-types';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { AutocompleteField, Form, LocalisedField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ModalActionRow } from '../components';
import { useSuggester } from '../api';

export const ChangeDietForm = ({ onCancel, onSubmit, dietId }) => {
  const dietSuggester = useSuggester('diet');
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
        suggester={dietSuggester}
        component={AutocompleteField}
      />
      <ModalActionRow
        confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
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
        dietId
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
