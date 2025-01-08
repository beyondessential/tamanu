import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  Field,
  Form,
  FormGrid,
  FormModal,
  FormSubmitCancelRow,
  LocalisedLocationField,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);

  return (
    <FormModal
      title={
        <TranslatedText stringId="patient.encounter.action.movePatient" fallback="Move patient" />
      }
      open={open}
      onClose={onClose}
    >
      <Form
        initialValues={{
          // Used in creation of associated notes
          submittedTime: getCurrentDateTimeString(),
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={submit}
        render={({ submitForm }) => (
          <FormGrid columns={1}>
            <Field
              name="locationId"
              component={LocalisedLocationField}
              label={
                <TranslatedText
                  stringId="patient.encounter.movePatient.location.label"
                  fallback="New location"
                />
              }
              required
            />
            <FormSubmitCancelRow onConfirm={submitForm} onCancel={onClose} />
          </FormGrid>
        )}
      />
    </FormModal>
  );
});
