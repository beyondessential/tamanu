import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { LAB_REQUEST_STATUSES } from '@tamanu/constants/labs';
import { ConfirmCancelRow } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

import { useSelectableColumn } from '../../Table';
import { DateDisplay } from '../../DateDisplay';
import { useApi } from '../../../api';

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
        data-testid="translatedtext-b8ck"
      />
    ),
    sortable: false,
  },
  {
    key: COLUMN_KEYS.DATE,
    title: (
      <TranslatedText
        stringId="general.requestDate.label"
        fallback="Request date"
        data-testid="translatedtext-o288"
      />
    ),
    sortable: false,
    accessor: ({ requestedDate }) => (
      <DateDisplay date={requestedDate} data-testid="datedisplay-6m7k" />
    ),
  },
  {
    key: COLUMN_KEYS.REQUESTED_BY,
    title: (
      <TranslatedText
        stringId="general.requestedBy.label"
        fallback="Requested by"
        data-testid="translatedtext-sqya"
      />
    ),
    sortable: false,
    accessor: ({ requestedBy }) => requestedBy?.displayName || '',
  },
  {
    key: COLUMN_KEYS.PRIORITY,
    title: (
      <TranslatedText
        stringId="lab.modal.printMultiple.table.column.priority"
        fallback="Priority"
        data-testid="translatedtext-rw16"
      />
    ),
    sortable: false,
    maxWidth: 70,
    accessor: ({ priority }) =>
      priority ? (
        <TranslatedReferenceData
          fallback={priority.name}
          value={priority.id}
          category={priority.type}
          data-testid="translatedreferencedata-tncl"
        />
      ) : (
        ''
      ),
  },
  {
    key: COLUMN_KEYS.CATEGORY,
    title: (
      <TranslatedText
        stringId="lab.testCategory.label"
        fallback="Test category"
        data-testid="translatedtext-fr1k"
      />
    ),
    sortable: false,
    accessor: ({ category }) =>
      category ? (
        <TranslatedReferenceData
          fallback={category.name}
          value={category.id}
          category={category.type}
          data-testid="translatedreferencedata-kyi2"
        />
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
        data-testid="translatedtext-6wcq"
      />
    ),
    sortable: false,
    accessor: getStatus,
  },
];

export const PrintMultipleLabRequestsSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const api = useApi();
  const {
    data: labRequestsData,
    error,
    isLoading,
  } = useQuery(['labRequests', encounter.id], async () => {
    const result = await api.get(`encounter/${encodeURIComponent(encounter.id)}/labRequests`, {
      includeNotes: 'true',
      status: [LAB_REQUEST_STATUSES.RECEPTION_PENDING, LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED],
      order: 'asc',
      orderBy: 'requestedDate',
    });
    return result.data;
  });

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
        data-testid="multiplelabrequestsprintoutmodal-7df9"
      />
      <PrintMultipleSelectionTable
        label={
          <TranslatedText
            stringId="lab.modal.printMultiple.selectText"
            fallback="Select the lab requests you would like to print"
            data-testid="translatedtext-url5"
          />
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
            data-testid="translatedtext-gqtn"
          />
        }
        allowExport={false}
        data-testid="printmultipleselectiontable-ii0g"
      />
      <FormDivider data-testid="formdivider-ta1j" />
      <ConfirmCancelRow
        cancelText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-gx9j"
          />
        }
        confirmText={
          <TranslatedText
            stringId="general.action.print"
            fallback="Print"
            data-testid="translatedtext-ookt"
          />
        }
        onConfirm={handlePrintConfirm}
        onCancel={onClose}
        data-testid="confirmcancelrow-ceqs"
      />
    </>
  );
});

PrintMultipleLabRequestsSelectionForm.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
