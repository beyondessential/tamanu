import React, { useState } from 'react';
import { useSuggester } from '../../../api';
import { AutocompleteInput, FormGrid, Modal, ModalActionRow } from '../../../components';

export const LabRequestChangePriorityModal = React.memo(
  ({ labRequest, updateLabReq, open, onClose }) => {
    const [priorityId, setPriorityId] = useState(labRequest.labTestPriorityId);
    const suggester = useSuggester('labTestPriority');

    const updateLab = async () => {
      await updateLabReq({
        labTestPriorityId: priorityId,
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
            value={priorityId}
            onChange={({ target: { value } }) => {
              setPriorityId(value);
            }}
          />
          <ModalActionRow confirmText="Confirm" onConfirm={updateLab} onCancel={onClose} />
        </FormGrid>
      </Modal>
    );
  },
);
