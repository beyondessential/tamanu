import React, { useEffect, useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { useParams } from 'react-router-dom';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';

import { useApi } from '../../api';
import { DateDisplay, DataFetchingTable } from '../../components';
// import { useLocalisation } from '../contexts/Localisation';

// const ADMITTED_PRIORITY_COLOR = '#bdbdbd';
const getDisplayName = ({ requestedByUser, requestedByUserId }) =>
  (requestedByUser || {}).displayName || requestedByUserId;
const getDetails = ({ status, error, recipients }) => {
  switch (status) {
    case REPORT_REQUEST_STATUSES.RECEIVED_BY_FACILITY:
      return 'Received by facility server, not synced to central';
    case REPORT_REQUEST_STATUSES.RECEIVED_BY_CENTRAL:
      return "Received by central, process hasn't started";
    case REPORT_REQUEST_STATUSES.PROCESSING_START:
      return `${Math.random(100)}% complete`;
    case REPORT_REQUEST_STATUSES.PROCESSING_FINISHED:
      return '100% complete - awaiting email';
    case REPORT_REQUEST_STATUSES.EMAILED:
      return `Emailed to ${JSON.parse(recipients)?.email ?? recipients}`;
    case REPORT_REQUEST_STATUSES.ERROR:
      return error || 'Report failed: No further details';
    default:
      return '';
  }
};

const STATUS_DISPLAY_MAP = {
  [REPORT_REQUEST_STATUSES.RECEIVED_BY_FACILITY]: 'Pending',
  [REPORT_REQUEST_STATUSES.RECEIVED_BY_CENTRAL]: 'Pending',
  [REPORT_REQUEST_STATUSES.PROCESSING_START]: 'In progress',
  [REPORT_REQUEST_STATUSES.PROCESSING_FINISHED]: 'In progress',
  [REPORT_REQUEST_STATUSES.EMAILED]: 'Emailed',
  [REPORT_REQUEST_STATUSES.ERROR]: 'Error',
};

const useColumns = () => {
  const api = useApi();
  const [availableReports, setAvailableReports] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const reports = await api.get('reports');
        setAvailableReports(reports);
      } catch (error) {
        setAvailableReports([]);
      }
    })();
  }, [api]);

  return [
    {
      key: 'reportType',
      title: 'Type',
      accessor: ({ reportType }) =>
        availableReports.find(({ id }) => id == reportType)?.name ?? reportType,
    },
    { key: 'requestedBy', title: 'Requested by', accessor: getDisplayName },
    {
      key: 'createdAt',
      title: 'Date/time',
      accessor: row => <DateDisplay date={row.createdAt} showTime />,
    },
    { key: 'status', title: 'Status', accessor: ({ status }) => STATUS_DISPLAY_MAP[status] },
    { key: 'id', title: 'Details', accessor: getDetails },
  ];
};

export const ReportRequestTable = React.memo(() => {
  const columns = useColumns();

  return (
    <DataFetchingTable
      endpoint="reportRequest"
      columns={columns}
      noDataMessage="No report requests found"
    />
  );
});
