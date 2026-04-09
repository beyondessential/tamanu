import React, { useCallback } from 'react';
import { startCase } from 'lodash';
import { FormModal } from '../../../../components/FormModal';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ReferenceDataForm } from './ReferenceDataForm';
import { useReferenceDataEditMutation } from './useReferenceDataEditMutation';

export const EditReferenceDataModal = ({
  open,
  onClose,
  columns,
  selectedType,
  record,
  onSuccess,
}) => {
  const { mutateAsync: editRecord } = useReferenceDataEditMutation(selectedType, {
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = useCallback(
    data => editRecord({ id: record.id, ...data }),
    [editRecord, record],
  );

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="admin.referenceData.editTitle"
          fallback="Edit :type"
          replacements={{ type: startCase(selectedType) }}
          data-testid="translatedtext-edit-refdata-title"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-edit-refdata"
    >
      <ReferenceDataForm
        columns={columns}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialValues={record}
        isEditMode
        data-testid="form-edit-refdata"
      />
    </FormModal>
  );
};
