import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router';
import { IMAGING_REQUEST_STATUS_CONFIG, IMAGING_TABLE_VERSIONS } from '@tamanu/constants';
import { SearchTableWithPermissionCheck } from './Table';
import { DateDisplay } from './DateDisplay';
import { PatientNameDisplay } from './PatientNameDisplay';
import { reloadPatient } from '../store/patient';
import { useEncounter } from '../contexts/Encounter';
import { reloadImagingRequest } from '../store';
import { useLocalisation } from '../contexts/Localisation';
import { getImagingRequestType } from '../utils/getImagingRequestType';
import { TableCellTag } from './Tag';
import { useImagingRequestsQuery } from '../contexts/ImagingRequests';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

const StatusDisplay = React.memo(({ status }) => {
  const {
    background = '#EDEDED',
    color = '#444444;',
    label = (
      <TranslatedText
        stringId="general.fallback.unknown"
        fallback="Unknown"
        data-testid="translatedtext-zecb"
      />
    ),
  } = IMAGING_REQUEST_STATUS_CONFIG[status];

  return (
    <TableCellTag $background={background} $color={color} data-testid="tablecelltag-8fjj">
      {label}
    </TableCellTag>
  );
});

const getDisplayName = ({ requestedBy }) => (requestedBy || {}).displayName || 'Unknown';
const getPatientName = ({ encounter }) => (
  <PatientNameDisplay patient={encounter.patient} data-testid="patientnamedisplay-rwx6" />
);
const getPatientDisplayId = ({ encounter }) => encounter.patient.displayId;
const getStatus = ({ status }) => (
  <StatusDisplay status={status} data-testid="statusdisplay-uuoz" />
);
const getDate = ({ requestedDate }) => (
  <DateDisplay date={requestedDate} timeOnlyTooltip data-testid="datedisplay-d0si" />
);
const getCompletedDate = ({ completedAt }) => (
  <DateDisplay date={completedAt} timeOnlyTooltip data-testid="datedisplay-xh2e" />
);
const getPriority = ({ priority }) => capitaliseFirstLetter(priority || 'Unknown');

export const ImagingRequestsTable = React.memo(({ encounterId, memoryKey, statuses = [] }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { facilityId } = useAuth();
  const { loadEncounter } = useEncounter();
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const { searchParameters } = useImagingRequestsQuery(memoryKey);
  const isCompletedTable = memoryKey === IMAGING_TABLE_VERSIONS.COMPLETED.memoryKey;
  const [isRowsDisabled, setIsRowsDisabled] = useState(false);

  const encounterColumns = [
    {
      key: 'displayId',
      title: (
        <TranslatedText
          stringId="imaging.requestId.label"
          fallback="Request ID"
          data-testid="translatedtext-req-id"
        />
      ),
      sortable: false,
    },
    {
      key: 'imagingType',
      title: (
        <TranslatedText
          stringId="general.type.label"
          fallback="Type"
          data-testid="translatedtext-type"
        />
      ),
      accessor: getImagingRequestType(imagingTypes),
    },
    {
      key: 'requestedDate',
      title: (
        <TranslatedText
          stringId="general.requestedAtTime.label"
          fallback="Requested at time"
          data-testid="translatedtext-req-time"
        />
      ),
      accessor: getDate,
    },
    {
      key: 'requestedBy.displayName',
      title: (
        <TranslatedText
          stringId="general.requestedBy.label"
          fallback="Requested by"
          data-testid="translatedtext-req-by"
        />
      ),
      accessor: getDisplayName,
    },
    ...(isCompletedTable
      ? [
          {
            key: 'completedAt',
            title: (
              <TranslatedText
                stringId="general.completed.label"
                fallback="Completed"
                data-testid="translatedtext-completed"
              />
            ),
            accessor: getCompletedDate,
          },
        ]
      : [
          {
            key: 'priority',
            title: (
              <TranslatedText
                stringId="imaging.priority.label"
                fallback="Priority"
                data-testid="translatedtext-priority"
              />
            ),
            accessor: getPriority,
          },
        ]),
    {
      key: 'status',
      title: (
        <TranslatedText
          stringId="general.status.label"
          fallback="Status"
          data-testid="translatedtext-status"
        />
      ),
      accessor: getStatus,
    },
  ];

  const globalColumns = [
    {
      key: 'encounter.patient.displayId',
      title: (
        <TranslatedText
          stringId="general.localisedField.displayId.label.short"
          fallback="NHN"
          data-testid="translatedtext-iwfv"
        />
      ),
      accessor: getPatientDisplayId,
      sortable: false,
    },
    {
      key: 'patient',
      title: (
        <TranslatedText
          stringId="general.patient.label"
          fallback="Patient"
          data-testid="translatedtext-patient"
        />
      ),
      accessor: getPatientName,
      sortable: false,
    },
    ...encounterColumns,
  ];

  const navigate = useNavigate();

  const selectImagingRequest = useCallback(
    async imagingRequest => {
      if (isRowsDisabled) return;
      setIsRowsDisabled(true);
      const { encounter } = imagingRequest;
      const patientId = params.patientId || encounter.patient.id;
      if (encounter) {
        await loadEncounter(encounter.id);
        await dispatch(reloadPatient(patientId));
      }
      await dispatch(reloadImagingRequest(imagingRequest.id));
      const category = params.category || 'all';
      const path = `/patients/${category}/${patientId}/encounter/${
        encounterId || encounter.id
      }/imaging-request/${imagingRequest.id}`;
      navigate(path);
      setIsRowsDisabled(false);
    },
    [
      loadEncounter,
      dispatch,
      params.patientId,
      params.category,
      encounterId,
      isRowsDisabled,
      navigate,
    ],
  );

  const globalImagingRequestsFetchOptions = useMemo(() => ({
    ...(statuses.length > 0 ? { status: statuses } : {}),
    ...searchParameters,
    facilityId,
  }), [searchParameters, statuses, facilityId]);

  return (
    <SearchTableWithPermissionCheck
      verb="list"
      noun="ImagingRequest"
      autoRefresh={!encounterId}
      endpoint={encounterId ? `encounter/${encounterId}/imagingRequests` : 'imagingRequest'}
      columns={encounterId ? encounterColumns : globalColumns}
      noDataMessage={
        <TranslatedText
          stringId="imaging.list.noData"
          fallback="No imaging requests found"
          data-testid="translatedtext-imaging.list-noData"
        />
      }
      onRowClick={selectImagingRequest}
      fetchOptions={encounterId ? undefined : globalImagingRequestsFetchOptions}
      elevated={false}
      initialSort={{
        order: 'desc',
        orderBy: isCompletedTable ? 'completedAt' : 'requestedDate',
      }}
      isRowsDisabled={isRowsDisabled}
      data-testid="searchtablewithpermissioncheck-jjp4"
    />
  );
});
