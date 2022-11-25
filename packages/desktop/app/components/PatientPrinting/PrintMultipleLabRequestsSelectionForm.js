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
    title: 'Date',
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
  const [titleData, setTitleData] = useState({});
  const [labRequestsData, setLabRequestsData] = useState([]);
  const [selectedLabRequestsData, setSelectedLabRequestsData] = useState([]);
  const api = useApi();
  const { data, error, isLoading } = useQuery(['labRequests', encounter.id], () =>
    api.get(`encounter/${encounter.id}/labRequests?includeNotePages=true&status=reception_pending`),
  );

  useEffect(() => {
    const labRequestss = data?.data || [];
    const newLabRequestss = labRequestss
      .filter(m => !m.discontinued)
      .map(m => ({ ...m, repeats: 0 }));
    setLabRequestsData(newLabRequestss);
  }, [data]);

  const cellOnChange = useCallback(
    (event, key, rowIndex) => {
      const newLabRequestsData = [...labRequestsData];
      if (key === COLUMN_KEYS.SELECTED) {
        newLabRequestsData[rowIndex][key] = event.target.checked;

        if (!event.target.checked) {
          setTitleData({ selected: false });
        }
      }

      const newSelectedLabRequestsData = newLabRequestsData.filter(m => m.selected);

      if (newSelectedLabRequestsData.length === newLabRequestsData.length) {
        setTitleData({ selected: true });
      }

      setSelectedLabRequestsData(newSelectedLabRequestsData);
    },
    [labRequestsData],
  );

  const headerOnChange = useCallback(
    (event, key) => {
      if (key === COLUMN_KEYS.SELECTED) {
        const newLabRequestsData = labRequestsData.map(m => ({
          ...m,
          selected: event.target.checked,
        }));

        setTitleData({ selected: event.target.checked });
        setLabRequestsData(newLabRequestsData);
        const newSelectedLabRequestsData = newLabRequestsData.filter(m => m.selected);
        setSelectedLabRequestsData(newSelectedLabRequestsData);
      }
    },
    [labRequestsData],
  );

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
          titleData={titleData}
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
