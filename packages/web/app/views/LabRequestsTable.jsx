import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { SearchTableWithPermissionCheck } from '../components';
import { reloadPatient } from '../store/patient';
import {
  getDateWithTimeTooltip,
  getPanelType,
  getPatientDisplayId,
  getPatientName,
  getPriority,
  getPublishedDate,
  getRequestId,
  getRequestType,
  getStatus,
} from '../utils/lab';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

export const LabRequestsTable = React.memo(
  ({ statuses, loadEncounter, loadLabRequest, searchParameters }) => {
    const isPublishedTable = statuses?.includes(LAB_REQUEST_STATUSES.PUBLISHED);

    const { facilityId } = useAuth();
    const { getDayBoundaries } = useDateTimeFormat();

    const columns = useMemo(() => {
      return [
        {
          key: 'displayId',
          title: (
            <TranslatedText
              stringId="general.localisedField.displayId.label.short"
              fallback="NHN"
              data-testid="translatedtext-n6rk"
            />
          ),
          accessor: getPatientDisplayId,
        },
        {
          key: 'patientName',
          title: <TranslatedText stringId="general.patient.label" fallback="Patient" />,
          accessor: getPatientName,
          maxWidth: 200,
          sortable: false,
        },
        {
          key: 'requestId',
          title: <TranslatedText stringId="lab.requestId.label.short" fallback="Test ID" />,
          accessor: getRequestId,
          sortable: false,
        },
        {
          key: 'labTestPanelName',
          title: <TranslatedText stringId="lab.panel.label" fallback="Panel" />,
          accessor: getPanelType,
        },
        {
          key: 'testCategory',
          title: <TranslatedText stringId="lab.testCategory.label" fallback="Test category" />,
          accessor: getRequestType,
        },
        {
          key: 'requestedDate',
          title: (
            <TranslatedText stringId="general.requestedAtTime.label" fallback="Requested at time" />
          ),
          accessor: getDateWithTimeTooltip,
        },
        isPublishedTable
          ? {
              key: 'publishedDate',
              title: <TranslatedText stringId="lab.completedDate.label" fallback="Completed" />,
              accessor: getPublishedDate,
            }
          : {
              key: 'priority',
              title: <TranslatedText stringId="lab.priority.label" fallback="Priority" />,
              accessor: getPriority,
            },
        {
          key: 'status',
          title: <TranslatedText stringId="general.status.label" fallback="Status" />,
          accessor: getStatus,
          maxWidth: 200,
          sortable: !isPublishedTable,
        },
      ];
    }, [isPublishedTable]);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const selectLab = async lab => {
      await loadEncounter(lab.encounterId);

      if (lab.patientId) {
        await dispatch(reloadPatient(lab.patientId));
      }
      const { patientId } = lab;
      await loadLabRequest(lab.id);
      navigate(`/patients/all/${patientId}/encounter/${lab.encounterId}/lab-request/${lab.id}`);
    };

    const { status, requestedDateFrom, requestedDateTo, ...searchFilters } = searchParameters;

    if (requestedDateFrom) {
      const boundaries = getDayBoundaries(requestedDateFrom);
      if (boundaries) searchFilters.requestedDateFrom = boundaries.start;
    }
    if (requestedDateTo) {
      const boundaries = getDayBoundaries(requestedDateTo);
      if (boundaries) searchFilters.requestedDateTo = boundaries.end;
    }

    return (
      <SearchTableWithPermissionCheck
        verb="list"
        noun="LabRequest"
        autoRefresh
        endpoint="labRequest"
        columns={columns}
        noDataMessage={
          <TranslatedText
            stringId="lab.list.noData"
            fallback="No lab requests found"
            data-testid="translatedtext-lab-request-list-noData"
          />
        }
        onRowClick={selectLab}
        fetchOptions={{
          ...searchFilters,
          statuses: status ? [status] : statuses,
          facilityId,
        }}
        initialSort={{
          order: 'desc',
          orderBy: isPublishedTable ? 'publishedDate' : 'requestedDate',
        }}
        data-testid="searchtablewithpermissioncheck-yyx3"
      />
    );
  },
);
