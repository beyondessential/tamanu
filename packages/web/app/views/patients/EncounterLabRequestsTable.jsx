import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { DataFetchingTable } from '../../components';
import { reloadPatient } from '../../store/patient';
import { useLabRequest } from '../../contexts/LabRequest';
import {
  getDateWithTimeTooltip,
  getPriority,
  getRequestedBy,
  getRequestId,
  getRequestType,
  getStatus,
} from '../../utils/lab';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const columns = [
  {
    key: 'requestId',
    title: <TranslatedText
      stringId="lab.table.column.testId"
      fallback="Test ID"
      data-test-id='translatedtext-1jea' />,
    sortable: false,
    accessor: getRequestId,
  },
  {
    key: 'category.name',
    title: <TranslatedText
      stringId="lab.testCategory.label"
      fallback="Test category"
      data-test-id='translatedtext-pyu8' />,
    accessor: getRequestType,
  },
  {
    key: 'requestedDate',
    title: (
      <TranslatedText
        stringId="lab.table.column.requestedDate"
        fallback="Requested at time"
        data-test-id='translatedtext-esay' />
    ),
    accessor: getDateWithTimeTooltip,
  },
  {
    key: 'displayName',
    title: <TranslatedText
      stringId="general.requestedBy.label"
      fallback="Requested by"
      data-test-id='translatedtext-8ixa' />,
    accessor: getRequestedBy,
    sortable: false,
  },
  {
    key: 'priority.name',
    title: <TranslatedText
      stringId="lab.table.column.priority"
      fallback="Priority"
      data-test-id='translatedtext-i287' />,
    accessor: getPriority,
  },
  {
    key: 'status',
    title: <TranslatedText
      stringId="lab.table.column.status"
      fallback="Status"
      data-test-id='translatedtext-y315' />,
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
        <TranslatedText
          stringId="lab.table.noData"
          fallback="No lab requests found"
          data-test-id='translatedtext-kc8i' />
      }
      onRowClick={selectLab}
      initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
      data-test-id='datafetchingtable-90ed' />
  );
});
