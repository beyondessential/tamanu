import React from 'react';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormGrid, FormSubmitCancelRow, useDateTimeFormat } from '@tamanu/ui-components';
import {
  Field,
  FormModal,
  LocalisedLocationField,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="patient.encounter.action.movePatient"
          fallback="Move patient"
          data-testid="translatedtext-o1ut"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-httn"
    >
      <Form
        initialValues={{
          // Used in creation of associated notes
          submittedTime: getCountryCurrentDateTimeString(),
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={submit}
        render={({ submitForm }) => (
          <FormGrid columns={1} data-testid="formgrid-wyqp">
            <Field
              name="locationId"
              component={LocalisedLocationField}
              label={
                <TranslatedText
                  stringId="patient.encounter.movePatient.location.label"
                  fallback="New location"
                  data-testid="translatedtext-35a6"
                />
              }
              required
              data-testid="field-tykg"
            />
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onClose}
              data-testid="formsubmitcancelrow-35ou"
            />
          </FormGrid>
        )}
        data-testid="form-0lgu"
      />
    </FormModal>
  );
});
