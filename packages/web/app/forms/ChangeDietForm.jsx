import React from 'react';
import PropTypes from 'prop-types';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormGrid, useDateTimeFormat } from '@tamanu/ui-components';

import { LocalisedField, SuggesterSelectField } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ModalActionRow } from '../components';

export const ChangeDietForm = ({ onCancel, onSubmit, dietIds }) => {
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1} data-testid="formgrid-r4hj">
      <LocalisedField
        name="dietIds"
        label={
          <TranslatedText
            stringId="general.localisedField.dietId.label"
            fallback="Diet"
            data-testid="translatedtext-0udr"
          />
        }
        endpoint="diet"
        component={SuggesterSelectField}
        isMulti
        data-testid="localisedfield-wlag"
      />
      <ModalActionRow
        confirmText={
          <TranslatedText
            stringId="general.action.confirm"
            fallback="Confirm"
            data-testid="translatedtext-6dac"
          />
        }
        onConfirm={submitForm}
        onCancel={onCancel}
        data-testid="modalactionrow-83gu"
      />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        // Used in creation of associated notes
        submittedTime: getCountryCurrentDateTimeString(),
        dietIds,
      }}
      formType={FORM_TYPES.EDIT_FORM}
      render={renderForm}
      onSubmit={onSubmit}
      data-testid="form-vanc"
    />
  );
};

ChangeDietForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
