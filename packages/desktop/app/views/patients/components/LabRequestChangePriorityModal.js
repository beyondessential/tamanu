import React, { useState } from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../../api';
import { AutocompleteInput, ConfirmCancelRow, FormGrid, Modal } from '../../../components';
import { Colors } from '../../../constants';

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  border-top: 1px solid ${Colors.outline};
  padding-top: 26px;
`;

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
          <StyledConfirmCancelRow onConfirm={updateLab} confirmText="Confirm" onCancel={onClose} />
        </FormGrid>
      </Modal>
    );
  },
);
