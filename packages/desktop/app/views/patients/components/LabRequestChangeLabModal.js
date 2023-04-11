import React, { useState } from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../../api';
import { AutocompleteInput, ConfirmCancelRow, FormGrid, Modal } from '../../../components';
import { Colors } from '../../../constants';

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  border-top: 1px solid ${Colors.outline};
  padding-top: 26px;
`;

export const LabRequestChangeLabModal = React.memo(
  ({ labRequest, updateLabReq, open, onClose }) => {
    const [labTestLaboratoryId, setLabTestLaboratoryId] = useState(labRequest.laboratory?.id);
    const laboratorySuggester = useSuggester('labTestLaboratory');

    const updateLab = async () => {
      await updateLabReq({
        labTestLaboratoryId,
      });
      onClose();
    };

    return (
      <Modal open={open} onClose={onClose} title="Change laboratory">
        <FormGrid columns={1}>
          <AutocompleteInput
            label="Laboratory"
            name="labTestLaboratoryId"
            suggester={laboratorySuggester}
            value={labTestLaboratoryId}
            onChange={({ target: { value } }) => {
              setLabTestLaboratoryId(value);
            }}
          />
          <StyledConfirmCancelRow onConfirm={updateLab} confirmText="Confirm" onCancel={onClose} />
        </FormGrid>
      </Modal>
    );
  },
);
