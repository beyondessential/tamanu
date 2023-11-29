import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { DataFetchingTable } from '../../components';
import { reloadPatient } from '../../store/patient';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  getRequestedBy,
  getStatus,
  getRequestType,
  getPriority,
  getDateWithTimeTooltip,
  getRequestId,
} from '../../utils/lab';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const columns = [
  {
    key: 'requestId',
    title: <TranslatedText stringId="labs.table.column.testId" fallback="Test ID" />,
    sortable: false,
    accessor: getRequestId,
  },
  {
    key: 'category.name',
    title: <TranslatedText stringId="labs.table.column.testCategory" fallback="Test category" />,
    accessor: getRequestType,
  },
  {
    key: 'requestedDate',
    title: (
      <TranslatedText stringId="labs.table.column.requestedDate" fallback="Requested at time" />
    ),
    accessor: getDateWithTimeTooltip,
  },
  {
    key: 'displayName',
    title: <TranslatedText stringId="labs.table.column.requestedBy" fallback="Requested by" />,
    accessor: getRequestedBy,
    sortable: false,
  },
  {
    key: 'priority.name',
    title: <TranslatedText stringId="labs.table.column.priority" fallback="Priority" />,
    accessor: getPriority,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="labs.table.column.status" fallback="Status" />,
    accessor: getStatus,
    maxWidth: 200,
  },
];

export const EncounterLabRequestsTable = React.memo(({ encounterId }) => {
  const { patientId, category } = useParams();
  const dispatch = useDispatch();
  const { loadLabRequest } = useLabRequest();

  const selectLab = async lab => {
    if (lab.patientId) await dispatch(reloadPatient(lab.patientId));
    await loadLabRequest(lab.id);
    dispatch(
      push(`/patients/${category}/${patientId}/encounter/${encounterId}/lab-request/${lab.id}`),
    );
  };

  return (
    <DataFetchingTable
      endpoint={`encounter/${encounterId}/labRequests`}
      columns={columns}
      noDataMessage={
        <TranslatedText stringId="labs.table.noData" fallback="No lab requests found" />
      }
      onRowClick={selectLab}
      initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
    />
  );
});
