import React, { useState } from 'react';
import { useSuggester } from '../../../api';
import { AutocompleteInput, ConfirmCancelRow, FormGrid, Modal } from '../../../components';

export const LabRequestChangePriorityModal = React.memo(
  ({ priority: initialPriority, updateLabReq, open, onClose }) => {
    const [priority, setPriority] = useState(initialPriority);
    const suggester = useSuggester('labTestPriority');

    const updateLab = async () => {
      await updateLabReq({
        labTestPriorityId: priority,
      });
      onClose();
    };

    return (
      <Modal open={open} onClose={onClose} title="Change priority">
        <FormGrid columns={1}>
          <AutocompleteInput
            label="Priority"
            name="priority"
            suggester={suggester}
            value={priority}
            onChange={({ target: { value } }) => {
              setPriority(value);
            }}
          />
          <ConfirmCancelRow onConfirm={updateLab} confirmText="Save" onCancel={onClose} />
        </FormGrid>
      </Modal>
    );
  },
);
