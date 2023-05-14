import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants/statuses';
import { Table, useSelectableColumn } from '../../Table';
import { OuterLabelFieldWrapper } from '../../Field';
import { ConfirmCancelRow } from '../../ButtonRow';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';

import { MultipleImagingRequestsPrintoutModal } from './MultipleImagingRequestsPrintoutModal';
import { COLUMN_KEYS, FORM_COLUMNS } from './multipleImagingRequestsColumns';

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

      <StyledLabelFieldWrapper label="Select the imaging requests you would like to print">
        <StyledTable
          headerColor={Colors.white}
          columns={columns}
          data={imagingRequestsData || []}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage="No imaging requests found"
          allowExport={false}
        />
      </StyledLabelFieldWrapper>
      <Rule />
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
