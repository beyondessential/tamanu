import React, { memo, useCallback } from 'react';
import { startCase } from 'lodash';
import { FormModal } from '../../../../components/FormModal';
import { useApi } from '../../../../api';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ReferenceDataForm } from './ReferenceDataForm';
import { ENDPOINT } from './constants';

export const AddReferenceDataModal = memo(
  ({ open, onClose, columns, selectedType, onSuccess }) => {
    const api = useApi();

    const handleSubmit = useCallback(
      async data => {
        await api.post(ENDPOINT, { type: selectedType, ...data });
        onSuccess();
        onClose();
      },
      [api, selectedType, onSuccess, onClose],
    );

    return (
      <FormModal
        title={
          <TranslatedText
            stringId="admin.referenceData.addTitle"
            fallback="Add :type"
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
          onSubmit={handleSubmit}
          onCancel={onClose}
          isEditMode={false}
          data-testid="form-add-refdata"
        />
      </FormModal>
    );
  },
);
