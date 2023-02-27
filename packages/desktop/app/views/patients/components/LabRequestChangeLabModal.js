import React, { useState } from 'react';
import { useSuggester } from '../../../api';
import { AutocompleteInput, ConfirmCancelRow, FormGrid, Modal } from '../../../components';

export const LabRequestChangeLabModal = React.memo(({ labId, updateLabReq, open, onClose }) => {
  const [lab, setLab] = useState(labId);
  const laboratorySuggester = useSuggester('labTestLaboratory');

  const updateLab = async () => {
    await updateLabReq({
      labTestLaboratoryId: lab,
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
          value={lab}
          onChange={({ target: { value } }) => {
            setLab(value);
          }}
        />
        <ConfirmCancelRow onConfirm={updateLab} confirmText="Save" onCancel={onClose} />
      </FormGrid>
    </Modal>
  );
});
