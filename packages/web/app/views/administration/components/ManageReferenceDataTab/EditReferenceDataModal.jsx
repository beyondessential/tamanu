import React, { memo, useCallback } from 'react';
import { startCase } from 'lodash';
import { FormModal } from '../../../../components/FormModal';
import { useApi } from '../../../../api';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ReferenceDataForm } from './ReferenceDataForm';
import { ENDPOINT } from './constants';

export const EditReferenceDataModal = memo(
  ({ open, onClose, columns, selectedType, record, onSuccess }) => {
    const api = useApi();

    const handleSubmit = useCallback(
      async data => {
        await api.put(`${ENDPOINT}/${record.id}`, { type: selectedType, ...data });
        onSuccess();
        onClose();
      },
      [api, selectedType, record, onSuccess, onClose],
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
  },
);
