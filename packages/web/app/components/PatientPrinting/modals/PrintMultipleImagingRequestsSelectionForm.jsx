import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants/statuses';

import { useSelectableColumn } from '../../Table';
import { ConfirmCancelRow } from '../../ButtonRow';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';

import { MultipleImagingRequestsPrintoutModal } from './MultipleImagingRequestsPrintoutModal';
import { COLUMN_KEYS, FORM_COLUMNS } from './multipleImagingRequestsColumns';
import { FormDivider, PrintMultipleSelectionTable } from './PrintMultipleSelectionTable';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintMultipleImagingRequestsSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const api = useApi();
  const { data: imagingRequestsData, error, isLoading } = useQuery(
    ['imagingRequests', encounter.id],
    async () => {
      const result = await api.get(
        `encounter/${encodeURIComponent(encounter.id)}/imagingRequests`,
        {
          includeNotes: 'true',
          status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          orderBy: 'requestedDate',
          order: 'ASC',
        },
      );
      return result.data;
    },
  );

  const { selectedRows, selectableColumn } = useSelectableColumn(imagingRequestsData, {
    columnKey: COLUMN_KEYS.SELECTED,
  });

  const handlePrintConfirm = useCallback(() => {
    if (selectedRows.length > 0) {
      setOpenPrintoutModal(true);
    }
  }, [selectedRows]);

  const columns = [selectableColumn, ...FORM_COLUMNS];

  return (
    <>
      <MultipleImagingRequestsPrintoutModal
        encounter={encounter}
        imagingRequests={selectedRows}
        open={openPrintoutModal}
        onClose={() => setOpenPrintoutModal(false)}
      />
      <PrintMultipleSelectionTable
        label={
          <TranslatedText
            stringId="imaging.modal.printMultiple.selectText"
            fallback="Select the imaging requests you would like to print"
            data-test-id='translatedtext-c1q1' />
        }
        headerColor={Colors.white}
        columns={columns}
        data={imagingRequestsData || []}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        noDataMessage={
          <TranslatedText
            stringId="imaging.modal.printMultiple.table.noData"
            fallback="No imaging requests found"
            data-test-id='translatedtext-546x' />
        }
        allowExport={false}
      />
      <FormDivider />
      <ConfirmCancelRow
        cancelText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-test-id='translatedtext-fgla' />}
        confirmText={<TranslatedText
          stringId="general.action.print"
          fallback="Print"
          data-test-id='translatedtext-p7i4' />}
        confirmDisabled={selectedRows.length === 0}
        onConfirm={handlePrintConfirm}
        onCancel={onClose}
      />
    </>
  );
});

PrintMultipleImagingRequestsSelectionForm.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
