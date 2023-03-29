import React, { useState } from 'react';
import { useSuggester } from '../../../api';
import { AutocompleteInput, ConfirmCancelRow, FormGrid, Modal } from '../../../components';

export const LabRequestChangeLabModal = React.memo(
  ({ laboratory, updateLabReq, open, onClose }) => {
    const [labId, setLabId] = useState(laboratory?.id);
    const laboratorySuggester = useSuggester('labTestLaboratory');

    const updateLab = async () => {
      await updateLabReq({
        labTestLaboratoryId: labId,
      });
      onClose();
    };

    return (
      <Modal open={open} onClose={onClose} title="Change lab request laboratory">
        <FormGrid columns={1}>
          <AutocompleteInput
            label="Laboratory"
            name="labTestLaboratoryId"
            suggester={laboratorySuggester}
            value={labId}
            onChange={({ target: { value } }) => {
              setLabId(value);
            }}
          />
          <ConfirmCancelRow onConfirm={updateLab} confirmText="Save" onCancel={onClose} />
        </FormGrid>
      </Modal>
    );
  },
);
