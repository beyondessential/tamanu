import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants/labs';

import { useSelectableColumn } from '../../Table';
import { ConfirmCancelRow } from '../../ButtonRow';
import { DateDisplay } from '../../DateDisplay';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';

import { MultipleLabRequestsPrintoutModal } from './MultipleLabRequestsPrintoutModal';
import { FormDivider, PrintMultipleSelectionTable } from './PrintMultipleSelectionTable';
import { getStatus } from '../../../utils/lab';
import { TranslatedText } from '../../Translation/TranslatedText';

const COLUMN_KEYS = {
  SELECTED: 'selected',
  DISPLAY_ID: 'displayId',
  DATE: 'date',
  REQUESTED_BY: 'requestedBy',
  PRIORITY: 'priority',
  CATEGORY: 'labTestCategory',
  STATUS: 'status',
};

const COLUMNS = [
  {
    key: COLUMN_KEYS.DISPLAY_ID,
    title: <TranslatedText stringId="labs.modal.print.table.column.testId" fallback="Test ID" />,
    sortable: false,
  },
  {
    key: COLUMN_KEYS.DATE,
    title: (
      <TranslatedText
        stringId="labs.modal.print.table.column.requestDate"
        fallback="Request date"
      />
    ),
    sortable: false,
    accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
  },
  {
    key: COLUMN_KEYS.REQUESTED_BY,
    title: (
      <TranslatedText
        stringId="labs.modal.print.table.column.requestedBy"
        fallback="Requested by"
      />
    ),
    sortable: false,
    accessor: ({ requestedBy }) => requestedBy?.displayName || '',
  },
  {
    key: COLUMN_KEYS.PRIORITY,
    title: <TranslatedText stringId="labs.modal.print.table.column.priority" fallback="Priority" />,
    sortable: false,
    maxWidth: 70,
    accessor: ({ priority }) => priority?.name || '',
  },
  {
    key: COLUMN_KEYS.CATEGORY,
    title: (
      <TranslatedText
        stringId="labs.modal.print.table.column.testCategory"
        fallback="Test category"
      />
    ),
    sortable: false,
    accessor: ({ category }) => category?.name || '',
  },
  {
    key: COLUMN_KEYS.STATUS,
    title: <TranslatedText stringId="labs.modal.print.table.column.status" fallback="Status" />,
    sortable: false,
    accessor: getStatus,
  },
];

export const PrintMultipleLabRequestsSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const api = useApi();
  const { data: labRequestsData, error, isLoading } = useQuery(
    ['labRequests', encounter.id],
    async () => {
      const result = await api.get(`encounter/${encodeURIComponent(encounter.id)}/labRequests`, {
        includeNotes: 'true',
        status: [LAB_REQUEST_STATUSES.RECEPTION_PENDING, LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED],
        order: 'asc',
        orderBy: 'requestedDate',
      });
      return result.data;
    },
  );

  const { selectedRows, selectableColumn } = useSelectableColumn(labRequestsData, {
    columnKey: COLUMN_KEYS.SELECTED,
  });

  const handlePrintConfirm = useCallback(() => {
    if (selectedRows.length > 0) {
      setOpenPrintoutModal(true);
    }
  }, [selectedRows]);

  return (
    <>
      <MultipleLabRequestsPrintoutModal
        encounter={encounter}
        labRequests={selectedRows}
        open={openPrintoutModal}
        onClose={() => setOpenPrintoutModal(false)}
      />
      <PrintMultipleSelectionTable
        label=<TranslatedText
          stringId="labs.modal.print.select"
          fallback="Select the lab requests you would like to print"
        />
        headerColor={Colors.white}
        columns={[selectableColumn, ...COLUMNS]}
        data={labRequestsData || []}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        noDataMessage=<TranslatedText
          stringId="labs.modal.print.table.noData"
          fallback="No lab requests found"
        />
        allowExport={false}
      />
      <FormDivider />
      <ConfirmCancelRow
        cancelText=<TranslatedText stringId="general.action.close" fallback="Close" />
        confirmText=<TranslatedText stringId="general.action.print" fallback="Print" />
        onConfirm={handlePrintConfirm}
        onCancel={onClose}
      />
    </>
  );
});

PrintMultipleLabRequestsSelectionForm.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
