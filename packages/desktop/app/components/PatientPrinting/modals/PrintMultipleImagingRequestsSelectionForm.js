import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/shared/constants/statuses';

import { useSelectableColumn } from '../../Table';
import { ConfirmCancelRow } from '../../ButtonRow';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';

import { MultipleImagingRequestsPrintoutModal } from './MultipleImagingRequestsPrintoutModal';
import { COLUMN_KEYS, FORM_COLUMNS } from './multipleImagingRequestsColumns';
import { FormDivider, PrintMultipleSelectionTable } from './PrintMultipleSelectionTable';

export const PrintMultipleImagingRequestsSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const api = useApi();
  const { data: imagingRequestsData, error, isLoading } = useQuery(
    ['imagingRequests', encounter.id],
    async () => {
      const result = await api.get(
        `encounter/${encodeURIComponent(encounter.id)}/imagingRequests`,
        {
          includeNotePages: 'true',
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
        label="Select the imaging requests you would like to print"
        headerColor={Colors.white}
        columns={columns}
        data={imagingRequestsData || []}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        noDataMessage="No imaging requests found"
        allowExport={false}
      />
      <FormDivider />
      <ConfirmCancelRow
        cancelText="Close"
        confirmText="Print"
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
