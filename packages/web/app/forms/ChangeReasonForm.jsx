import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES, REASON_FOR_ENCOUNTER_MAX_CHARACTERS } from '../constants';
import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ModalActionRow } from '../components';
import { useTranslation } from '../contexts/Translation';

export const ChangeReasonForm = ({ onCancel, onSubmit, reasonForEncounter }) => {
  const { getTranslation } = useTranslation();
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="reasonForEncounter"
        label={
          <TranslatedText
            stringId="encounter.reasonForEncounter.label"
            fallback="Reason for encounter"
            data-test-id='translatedtext-isib' />
        }
        component={TextField}
        data-test-id='field-s5bh' />
      <ModalActionRow
        confirmText={<TranslatedText
          stringId="general.action.confirm"
          fallback="Confirm"
          data-test-id='translatedtext-bosh' />}
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
