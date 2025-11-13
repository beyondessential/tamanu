import React, { useState } from 'react';
import { useSuggester } from '../../../api';
import { FormGrid } from '@tamanu/ui-components';
import { AutocompleteInput, FormModal, ModalActionRow } from '../../../components';
import { TranslatedText } from '../../../components/Translation';

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
      <FormModal open={open} onClose={onClose} title="Change priority" data-testid="formmodal-60sp">
        <FormGrid columns={1} data-testid="formgrid-qnfm">
          <AutocompleteInput
            label={
              <TranslatedText
                stringId="lab.priority.label"
                fallback="Priority"
                data-testid="translatedtext-nlwg"
              />
            }
            name="priority"
            suggester={suggester}
            value={priorityId}
            onChange={({ target: { value } }) => {
              setPriorityId(value);
            }}
            data-testid="autocompleteinput-lob3"
          />
          <ModalActionRow
            confirmText="Confirm"
            onConfirm={updateLab}
            onCancel={onClose}
            data-testid="modalactionrow-3tr8"
          />
        </FormGrid>
      </FormModal>
    );
  },
);
