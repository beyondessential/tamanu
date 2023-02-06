import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { Table, useSelectableColumn } from '../../Table';
import { OuterLabelFieldWrapper } from '../../Field';
import { ConfirmCancelRow } from '../../ButtonRow';
import { DateDisplay } from '../../DateDisplay';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { getImagingRequestType } from '../../../utils/getImagingRequestType';
import { getAreaNote } from '../../../utils/areaNote';
import { useLocalisation } from '../../../contexts/Localisation';

import { MultipleImagingRequestsPrintoutModal } from './MultipleImagingRequestsPrintoutModal';

const COLUMN_KEYS = {
  ID: 'id',
  SELECTED: 'selected',
  REQUESTED_DATE: 'requestedDate',
  REQUESTED_BY: 'requestedBy',
  TYPE: 'imagingType',
  AREAS: 'areas',
};

export const PrintMultipleImagingRequestsSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const api = useApi();
  // TODO: make sure endpoint supports query parameters
  const { data: imagingRequestsData, error, isLoading } = useQuery(
    ['imagingRequests', encounter.id],
    async () => {
      const result = await api.get(
        `encounter/${encodeURIComponent(encounter.id)}/imagingRequests`,
        {
          includeNotePages: 'true',
          status: 'reception_pending',
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

  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const columns = [
    selectableColumn,
    {
      key: COLUMN_KEYS.ID,
      title: 'Request ID',
      sortable: false,
    },
    {
      key: COLUMN_KEYS.REQUESTED_DATE,
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
      key: COLUMN_KEYS.TYPE,
      title: 'Type',
      sortable: false,
      maxWidth: 70,
      accessor: getImagingRequestType(imagingTypes),
    },
    {
      key: COLUMN_KEYS.AREAS,
      title: 'Areas to be imaged',
      sortable: false,
      accessor: getAreaNote,
    },
  ];

  return (
    <>
      <MultipleImagingRequestsPrintoutModal
        encounter={encounter}
        imagingRequests={selectedRows}
        open={openPrintoutModal}
        onClose={() => setOpenPrintoutModal(false)}
      />

      <OuterLabelFieldWrapper label="Select the imaging requests you would like to print">
        <Table
          headerColor={Colors.white}
          columns={columns}
          data={imagingRequestsData || []}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage="No imaging requests found"
          allowExport={false}
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

PrintMultipleImagingRequestsSelectionForm.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
