import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import styled from 'styled-components';
import { Table, useSelectableColumn } from '../../Table';
import { OuterLabelFieldWrapper } from '../../Field';
import { ConfirmCancelRow } from '../../ButtonRow';
import { DateDisplay } from '../../DateDisplay';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';

import { MultipleLabRequestsPrintoutModal } from './MultipleLabRequestsPrintoutModal';

const StyledTable = styled(Table)`
  border: none;
  border-radius: 5px;
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr td:first-child {
    border-bottom: none;
  }
  thead tr th {
    color: ${Colors.midText};
  }
}`;

const StyledLabelFieldWrapper = styled(OuterLabelFieldWrapper)`
  .label-field {
    margin-bottom: 15px;
  }
  padding: 25px 30px;
`;

export const Rule = styled.div`
  margin: 15px 0 30px 0;
  width: calc(100% + 64px);
  height: 1px;
  background-color: ${Colors.outline};
  position: relative;
  left: -32px;
`;

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
  const api = useApi();
  const { data: labRequestsData, error, isLoading } = useQuery(
    ['labRequests', encounter.id],
    async () => {
      const result = await api.get(`encounter/${encodeURIComponent(encounter.id)}/labRequests`, {
        includeNotePages: 'true',
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
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

      <StyledLabelFieldWrapper label="Select the lab requests you would like to print">
        <StyledTable
          headerColor={Colors.white}
          columns={[selectableColumn, ...COLUMNS]}
          data={labRequestsData || []}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage="No lab requests found"
          allowExport={false}
        />
      </StyledLabelFieldWrapper>
      <Rule />
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
