import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { Table } from '../Table';
import { CheckInput, OuterLabelFieldWrapper } from '../Field';
import { ConfirmCancelRow } from '../ButtonRow';
import { DateDisplay } from '../DateDisplay';
import { MultipleLabRequestsPrintoutModal } from './MultipleLabRequestsPrintoutModal';
import { useApi } from '../../api';
import { Colors } from '../../constants';

const COLUMN_KEYS = {
  SELECTED: 'selected',
  DISPLAY_ID: 'displayId',
  DATE: 'date',
  REQUESTED_BY: 'requestedBy',
  PRIORITY: 'priority',
  CATEGORY: 'labTestCategory',
};

const COLUMNS = [
  {
    key: COLUMN_KEYS.SELECTED,
    title: '',
    sortable: false,
    titleAccessor: ({ onChange, selected }) => (
      <CheckInput value={selected} name="selected" onChange={onChange} />
    ),
    accessor: ({ onChange, selected }) => (
      <CheckInput value={selected} name="selected" onChange={onChange} />
    ),
  },
  {
    key: COLUMN_KEYS.DISPLAY_ID,
    title: 'Test ID',
    sortable: false,
  },
  {
    key: COLUMN_KEYS.DATE,
    title: 'Request date',
    sortable: false,
    accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
  },
  {
    key: COLUMN_KEYS.REQUESTED_BY,
    title: 'Requested by',
    sortable: false,
    maxWidth: 300,
    accessor: ({ requestedBy }) => requestedBy?.displayName || '',
  },
  {
    key: COLUMN_KEYS.PRIORITY,
    title: 'Priority',
    sortable: false,
    maxWidth: 70,
    accessor: ({ priority }) => priority?.name || '',
  },
  {
    key: COLUMN_KEYS.CATEGORY,
    title: 'Test category',
    sortable: false,
    accessor: ({ category }) => category?.name || '',
  },
];

export const PrintMultipleLabRequestsSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const [labRequestsData, setLabRequestsData] = useState([]);
  const api = useApi();
  const { data, error, isLoading } = useQuery(['labRequests', encounter.id], () =>
    api.get(`encounter/${encodeURIComponent(encounter.id)}/labRequests`, {
      includeNotePages: 'true',
      status: 'reception_pending',
      order: 'asc',
      orderBy: 'requestedDate',
    }),
  );

  useEffect(() => {
    const allLabRequests = data?.data || [];
    setLabRequestsData(allLabRequests);
  }, [data]);

  const cellOnChange = useCallback(
    (event, key, rowIndex) => {
      if (key !== COLUMN_KEYS.SELECTED) {
        return;
      }
      const newLabRequestsData = [...labRequestsData];
      newLabRequestsData[rowIndex] = {
        ...labRequestsData[rowIndex],
        [key]: event.target.checked,
      };
      setLabRequestsData(newLabRequestsData);
    },
    [labRequestsData],
  );

  const headerOnChange = useCallback(
    (event, key) => {
      if (key !== COLUMN_KEYS.SELECTED) {
        return;
      }
      const newLabRequestsData = labRequestsData.map(lr => ({
        ...lr,
        selected: event.target.checked,
      }));
      setLabRequestsData(newLabRequestsData);
    },
    [labRequestsData],
  );

  const selectedLabRequestsData = labRequestsData.filter(lr => lr.selected);
  const isEveryRowSelected = selectedLabRequestsData.length === labRequestsData.length;

  const handlePrintConfirm = useCallback(() => {
    if (selectedLabRequestsData.length > 0) {
      setOpenPrintoutModal(true);
    }
  }, [selectedLabRequestsData]);

  return (
    <>
      <MultipleLabRequestsPrintoutModal
        encounter={encounter}
        labRequests={selectedLabRequestsData}
        open={openPrintoutModal}
        onClose={() => setOpenPrintoutModal(false)}
      />

      <OuterLabelFieldWrapper label="Select the lab requests you would like to print">
        <Table
          headerColor={Colors.white}
          columns={COLUMNS}
          titleData={{ selected: isEveryRowSelected }}
          data={labRequestsData || []}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage="No lab requests found"
          allowExport={false}
          cellOnChange={cellOnChange}
          headerOnChange={headerOnChange}
        />
      </OuterLabelFieldWrapper>
      <ConfirmCancelRow
        cancelText="Close"
        confirmText="Print"
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
