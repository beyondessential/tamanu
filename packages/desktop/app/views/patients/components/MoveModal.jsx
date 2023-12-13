import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import React from 'react';
import { usePatientMove } from '../../../api/mutations';
import {
  Field,
  Form,
  FormGrid,
  FormModal,
  FormSubmitCancelRow,
  LocalisedLocationField,
} from '../../../components';

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
