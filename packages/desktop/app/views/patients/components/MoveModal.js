import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useSuggester } from '../../../api';
import {
  Modal,
  FormGrid,
  ConfirmCancelRow,
  Form,
  Field,
  AutocompleteField,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);

  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });

  return (
    <Modal title="Move patient" open={open} onClose={onClose}>
      <Form
        initialValues={{
          locationId: encounter.location.id,
          // Used in creation of associated notes
          submittedTime: getCurrentDateTimeString(),
        }}
        onSubmit={submit}
        render={({ submitForm }) => (
          <FormGrid columns={1}>
            <Field
              name="locationId"
              component={AutocompleteField}
              suggester={locationSuggester}
              label="New location"
              required
            />
            <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
          </FormGrid>
        )}
      />
    </Modal>
  );
});
