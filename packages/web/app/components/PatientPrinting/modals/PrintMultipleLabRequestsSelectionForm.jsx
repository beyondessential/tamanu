import React, { useCallback, useState } from 'react';
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
import { TranslatedText, TranslatedReferenceData } from '../../Translation';

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
    title: (
      <TranslatedText
        stringId="lab.modal.printMultiple.table.column.testId"
        fallback="Test ID"
        data-test-id='translatedtext-dwvf' />
    ),
    sortable: false,
  },
  {
    key: COLUMN_KEYS.DATE,
    title: <TranslatedText
      stringId="general.requestDate.label"
      fallback="Request date"
      data-test-id='translatedtext-muy7' />,
    sortable: false,
    accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} data-test-id='datedisplay-zlpj' />,
  },
  {
    key: COLUMN_KEYS.REQUESTED_BY,
    title: <TranslatedText
      stringId="general.requestedBy.label"
      fallback="Requested by"
      data-test-id='translatedtext-puwf' />,
    sortable: false,
    accessor: ({ requestedBy }) => requestedBy?.displayName || '',
  },
  {
    key: COLUMN_KEYS.PRIORITY,
    title: (
      <TranslatedText
        stringId="lab.modal.printMultiple.table.column.priority"
        fallback="Priority"
        data-test-id='translatedtext-c8fv' />
    ),
    sortable: false,
    maxWidth: 70,
    accessor: ({ priority }) =>
      priority ? (
        <TranslatedReferenceData
          fallback={priority.name}
          value={priority.id}
          category={priority.type}
          data-test-id='translatedreferencedata-83r9' />
      ) : (
        ''
      ),
  },
  {
    key: COLUMN_KEYS.CATEGORY,
    title: <TranslatedText
      stringId="lab.testCategory.label"
      fallback="Test category"
      data-test-id='translatedtext-cp94' />,
    sortable: false,
    accessor: ({ category }) =>
      category ? (
        <TranslatedReferenceData
          fallback={category.name}
          value={category.id}
          category={category.type}
          data-test-id='translatedreferencedata-zujj' />
      ) : (
        ''
      ),
  },
  {
    key: COLUMN_KEYS.STATUS,
    title: (
      <TranslatedText
        stringId="lab.modal.printMultiple.table.column.status"
        fallback="Status"
        data-test-id='translatedtext-cp0y' />
    ),
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
        label={
          <TranslatedText
            stringId="lab.modal.printMultiple.selectText"
            fallback="Select the lab requests you would like to print"
            data-test-id='translatedtext-ljsy' />
        }
        headerColor={Colors.white}
        columns={[selectableColumn, ...COLUMNS]}
        data={labRequestsData || []}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        noDataMessage={
          <TranslatedText
            stringId="lab.modal.printMultiple.table.noData"
            fallback="No lab requests found"
            data-test-id='translatedtext-im2v' />
        }
        allowExport={false}
      />
      <FormDivider />
      <ConfirmCancelRow
        cancelText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-test-id='translatedtext-3vdw' />}
        confirmText={<TranslatedText
          stringId="general.action.print"
          fallback="Print"
          data-test-id='translatedtext-xxlv' />}
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
