import React, { useState } from 'react';
import { useSuggester } from '../../../api';
import { AutocompleteField, ConfirmCancelRow, FormGrid, Modal } from '../../../components';

export const LabRequestChangeLabModal = React.memo(
  ({ laboratory, updateLabReq, open, onClose }) => {
    const [lab, setLab] = useState(laboratory);
    const laboratorySuggester = useSuggester('labTestLaboratory');

    const updateLab = async () => {
      await updateLabReq({
        labTestLaboratoryId: lab,
      });
      onClose();
    };

    return (
      <Modal open={open} onClose={onClose} title="Change lab request laboratory">
        <FormGrid columns={1}>
          <AutocompleteField
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
  },
);
