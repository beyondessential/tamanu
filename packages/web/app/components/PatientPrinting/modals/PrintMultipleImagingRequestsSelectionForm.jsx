import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants/statuses';
import { ConfirmCancelRow, TAMANU_COLORS } from '@tamanu/ui-components';

import { useSelectableColumn } from '../../Table';
import { useApi } from '../../../api';

import { MultipleImagingRequestsPrintoutModal } from './MultipleImagingRequestsPrintoutModal';
import { COLUMN_KEYS, FORM_COLUMNS } from './multipleImagingRequestsColumns';
import { FormDivider, PrintMultipleSelectionTable } from './PrintMultipleSelectionTable';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintMultipleImagingRequestsSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const api = useApi();
  const {
    data: imagingRequestsData,
    error,
    isLoading,
  } = useQuery(['imagingRequests', encounter.id], async () => {
    const result = await api.get(`encounter/${encodeURIComponent(encounter.id)}/imagingRequests`, {
      includeNotes: 'true',
      status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
      orderBy: 'requestedDate',
      order: 'ASC',
    });
    return result.data;
  });

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
        data-testid="multipleimagingrequestsprintoutmodal-cky3"
      />
      <PrintMultipleSelectionTable
        label={
          <TranslatedText
            stringId="imaging.modal.printMultiple.selectText"
            fallback="Select the imaging requests you would like to print"
            data-testid="translatedtext-7iz8"
          />
        }
        headerColor={TAMANU_COLORS.white}
        columns={columns}
        data={imagingRequestsData || []}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        noDataMessage={
          <TranslatedText
            stringId="imaging.modal.printMultiple.table.noData"
            fallback="No imaging requests found"
            data-testid="translatedtext-i7d3"
          />
        }
        allowExport={false}
        data-testid="printmultipleselectiontable-hh3u"
      />
      <FormDivider data-testid="formdivider-i5wy" />
      <ConfirmCancelRow
        cancelText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-mu2y"
          />
        }
        confirmText={
          <TranslatedText
            stringId="general.action.print"
            fallback="Print"
            data-testid="translatedtext-4k0b"
          />
        }
        confirmDisabled={selectedRows.length === 0}
        onConfirm={handlePrintConfirm}
        onCancel={onClose}
        data-testid="confirmcancelrow-8zqu"
      />
    </>
  );
});

PrintMultipleImagingRequestsSelectionForm.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
