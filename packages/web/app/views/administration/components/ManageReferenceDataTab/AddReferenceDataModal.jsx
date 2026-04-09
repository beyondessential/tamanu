import React from 'react';
import { startCase } from 'lodash';
import { FormModal } from '../../../../components/FormModal';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ReferenceDataForm } from './ReferenceDataForm';
import { useReferenceDataCreateMutation } from './useReferenceDataCreateMutation';

export const AddReferenceDataModal = ({ open, onClose, columns, selectedType, onSuccess }) => {
  const { mutateAsync: createRecord } = useReferenceDataCreateMutation(selectedType, {
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="admin.referenceData.addTitle"
          fallback="Add reference data | :type"
          replacements={{ type: startCase(selectedType) }}
          data-testid="translatedtext-add-refdata-title"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-add-refdata"
    >
      <ReferenceDataForm
        columns={columns}
        onSubmit={createRecord}
        onCancel={onClose}
        isEditMode={false}
        data-testid="form-add-refdata"
      />
    </FormModal>
  );
};
