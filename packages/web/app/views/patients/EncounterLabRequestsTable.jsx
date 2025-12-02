import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router';
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
    title: (
      <TranslatedText
        stringId="lab.table.column.testId"
        fallback="Test ID"
        data-testid="translatedtext-a3ga"
      />
    ),
    sortable: false,
    accessor: getRequestId,
  },
  {
    key: 'category.name',
    title: (
      <TranslatedText
        stringId="lab.testCategory.label"
        fallback="Test category"
        data-testid="translatedtext-7vec"
      />
    ),
    accessor: getRequestType,
    sortable: false,
  },
  {
    key: 'requestedDate',
    title: (
      <TranslatedText
        stringId="lab.table.column.requestedDate"
        fallback="Requested at time"
        data-testid="translatedtext-1lzv"
      />
    ),
    accessor: getDateWithTimeTooltip,
    sortable: false,
  },
  {
    key: 'displayName',
    title: (
      <TranslatedText
        stringId="general.requestedBy.label"
        fallback="Requested by"
        data-testid="translatedtext-9k8h"
      />
    ),
    accessor: getRequestedBy,
    sortable: false,
  },
  {
    key: 'priority.name',
    title: (
      <TranslatedText
        stringId="lab.table.column.priority"
        fallback="Priority"
        data-testid="translatedtext-pha3"
      />
    ),
    accessor: getPriority,
    sortable: false,
  },
  {
    key: 'status',
    title: (
      <TranslatedText
        stringId="lab.table.column.status"
        fallback="Status"
        data-testid="translatedtext-n009"
      />
    ),
    accessor: getStatus,
    maxWidth: 200,
    sortable: false,
  },
];

export const EncounterLabRequestsTable = React.memo(({ encounterId }) => {
  const { patientId, category } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loadLabRequest } = useLabRequest();

  const selectLab = async lab => {
    if (lab.patientId) await dispatch(reloadPatient(lab.patientId));
    await loadLabRequest(lab.id);
    navigate(`/patients/${category}/${patientId}/encounter/${encounterId}/lab-request/${lab.id}`);
  };

  return (
    <DataFetchingTable
      endpoint={`encounter/${encounterId}/labRequests`}
      columns={columns}
      noDataMessage={
        <TranslatedText
          stringId="lab.table.noData"
          fallback="No lab requests found"
          data-testid="translatedtext-uv5q"
        />
      }
      onRowClick={selectLab}
      initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
      data-testid="datafetchingtable-1jgd"
    />
  );
});
