import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { REASON_FOR_ENCOUNTER_MAX_CHARACTERS } from '../constants';
import { FORM_TYPES } from '@tamanu/constants';
import { TextField, Form, FormGrid, useDateTimeFormat } from '@tamanu/ui-components';
import { Field } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ModalActionRow } from '../components';
import { useTranslation } from '../contexts/Translation';

export const ChangeReasonForm = ({ onCancel, onSubmit, reasonForEncounter }) => {
  const { getTranslation } = useTranslation();
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1} data-testid="formgrid-srim">
      <Field
        name="reasonForEncounter"
        label={
          <TranslatedText
            stringId="encounter.reasonForEncounter.label"
            fallback="Reason for encounter"
            data-testid="translatedtext-88j1"
          />
        }
        component={TextField}
        data-testid="field-0ywv"
      />
      <ModalActionRow
        confirmText={
          <TranslatedText
            stringId="general.action.confirm"
            fallback="Confirm"
            data-testid="translatedtext-0taz"
          />
        }
        onConfirm={submitForm}
        onCancel={onCancel}
        data-testid="modalactionrow-eo6d"
      />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        // Used in creation of associated notes
        submittedTime: getCountryCurrentDateTimeString(),
        reasonForEncounter,
      }}
      formType={FORM_TYPES.EDIT_FORM}
      render={renderForm}
      onSubmit={onSubmit}
      validationSchema={yup.object().shape({
        reasonForEncounter: yup
          .string()
          .max(
            REASON_FOR_ENCOUNTER_MAX_CHARACTERS,
            getTranslation(
              'reasonForEncounter.validation.rule.maxNCharacters',
              'Reason for encounter must not exceed :maxChars characters',
              { replacements: { maxChars: REASON_FOR_ENCOUNTER_MAX_CHARACTERS } },
            ),
          ),
      })}
      data-testid="form-20qr"
    />
  );
};

ChangeReasonForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  reasonForEncounter: PropTypes.string.isRequired,
};

ChangeReasonForm.defaultProps = {
  reasonForEncounter: '',
};
