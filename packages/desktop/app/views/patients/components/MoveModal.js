import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import {
  FormModal,
  FormGrid,
  FormSubmitCancelRow,
  Form,
  Field,
  LocalisedLocationField,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);

  return (
    <FormModal title="Move patient" open={open} onClose={onClose}>
      <Form
        initialValues={{
          // Used in creation of associated notes
          submittedTime: getCurrentDateTimeString(),
        }}
        onSubmit={submit}
        render={({ submitForm }) => (
          <FormGrid columns={1}>
            <Field
              name="locationId"
              component={LocalisedLocationField}
              label="New location"
              required
            />
            <FormSubmitCancelRow onConfirm={submitForm} onCancel={onClose} />
          </FormGrid>
        )}
      />
    </FormModal>
  );
});
