import React, { useState } from 'react';
import { useSuggester } from '../../../api';
import { AutocompleteInput, ConfirmCancelRow, FormGrid, Modal } from '../../../components';

export const LabRequestChangeLabModal = React.memo(
  ({ labTestLaboratoryId: initialLabId, updateLabReq, open, onClose }) => {
    const [labTestLaboratoryId, setLabTestLaboratoryId] = useState(initialLabId);
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
          <ConfirmCancelRow onConfirm={updateLab} confirmText="Save" onCancel={onClose} />
        </FormGrid>
      </Modal>
    );
  },
);
