import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../../api';
import { AutocompleteInput, ConfirmCancelRow, FormGrid, Modal } from '../../../components';
import { Colors } from '../../../constants';

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  border-top: 1px solid ${Colors.outline};
  padding-top: 26px;
`;

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

    useEffect(() => {
      setPriority(initialPriority);
    }, [initialPriority]);

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
          <StyledConfirmCancelRow onConfirm={updateLab} confirmText="Confirm" onCancel={onClose} />
        </FormGrid>
      </Modal>
    );
  },
);
