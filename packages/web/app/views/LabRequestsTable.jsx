import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
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
  ({ status = '', loadEncounter, loadLabRequest, searchParameters }) => {
    const publishedStatus = status === LAB_REQUEST_STATUSES.PUBLISHED;

    const { facilityId } = useAuth();

    const columns = useMemo(() => {
      return [
        {
          key: 'displayId',
          title: (
            <TranslatedText
              stringId="general.localisedField.displayId.label.short"
              fallback="NHN"
            />
          ),
          accessor: getPatientDisplayId,
        },
        {
          key: 'patientName',
          title: 'Patient',
          accessor: getPatientName,
          maxWidth: 200,
          sortable: false,
        },
        { key: 'requestId', title: 'Test ID', accessor: getRequestId, sortable: false },
        { key: 'labTestPanelName', title: 'Panel', accessor: getPanelType },
        { key: 'testCategory', title: 'Test category', accessor: getRequestType },
        { key: 'requestedDate', title: 'Requested at time', accessor: getDateWithTimeTooltip },
        publishedStatus
          ? { key: 'publishedDate', title: 'Completed', accessor: getPublishedDate }
          : { key: 'priority', title: 'Priority', accessor: getPriority },
        {
          key: 'status',
          title: 'Status',
          accessor: getStatus,
          maxWidth: 200,
          sortable: !publishedStatus,
        },
      ];
    }, [publishedStatus]);
    const dispatch = useDispatch();

    const selectLab = async lab => {
      await loadEncounter(lab.encounterId);

      if (lab.patientId) {
        await dispatch(reloadPatient(lab.patientId, facilityId));
      }
      const { patientId } = lab;
      await loadLabRequest(lab.id);
      dispatch(
        push(`/patients/all/${patientId}/encounter/${lab.encounterId}/lab-request/${lab.id}`),
      );
    };

    return (
      <SearchTableWithPermissionCheck
        verb="list"
        noun="LabRequest"
        autoRefresh
        endpoint="labRequest"
        columns={columns}
        noDataMessage="No lab requests found"
        onRowClick={selectLab}
        fetchOptions={{
          ...searchParameters,
          ...(status && { status }),
          facilityId,
        }}
        initialSort={{
          order: 'desc',
          orderBy: publishedStatus ? 'publishedDate' : 'requestedDate',
        }}
      />
    );
  },
);
