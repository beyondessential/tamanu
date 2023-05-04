import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { LAB_REQUEST_STATUSES } from 'shared/constants';
import { SearchTable } from '../components';
import { reloadPatient } from '../store/patient';
import {
  getRequestedBy,
  getPatientName,
  getPatientDisplayId,
  getRequestType,
  getPriority,
  getDateTime,
  getRequestId,
  getPublishedDate,
} from '../utils/lab';

export const LabRequestsTable = React.memo(
  ({ status = '', loadEncounter, loadLabRequest, searchParameters }) => {
    const publishedStatus = status === LAB_REQUEST_STATUSES.PUBLISHED;

    const columns = useMemo(() => {
      return [
        {
          key: 'displayId',
          accessor: getPatientDisplayId,
        },
        {
          key: 'patientName',
          title: 'Patient',
          accessor: getPatientName,
          maxWidth: 200,
        },
        { key: 'requestId', title: 'Test ID', accessor: getRequestId },
        { key: 'testCategory', title: 'Test category', accessor: getRequestType },
        { key: 'labTestPanelName', title: 'Panel' },
        { key: 'requestedDate', title: 'Requested at time', accessor: getDateTime },
        { key: 'requestedBy', title: 'Requested by', accessor: getRequestedBy },
        publishedStatus
          ? { key: 'publishedDate', title: 'Published', accessor: getPublishedDate }
          : { key: 'priority', title: 'Priority', accessor: getPriority },
      ];
    }, [publishedStatus]);
    const dispatch = useDispatch();

    const selectLab = async lab => {
      await loadEncounter(lab.encounterId);

      if (lab.patientId) {
        await dispatch(reloadPatient(lab.patientId));
      }
      const { patientId } = lab;
      await loadLabRequest(lab.id);
      dispatch(
        push(`/patients/all/${patientId}/encounter/${lab.encounterId}/lab-request/${lab.id}`),
      );
    };

    return (
      <SearchTable
        endpoint="labRequest"
        columns={columns}
        noDataMessage="No lab requests found"
        onRowClick={selectLab}
        fetchOptions={{
          ...searchParameters,
          ...(status && { status }),
        }}
        initialSort={{ order: 'desc', orderBy: 'requestedDate' }}
      />
    );
  },
);
