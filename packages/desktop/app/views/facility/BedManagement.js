import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';

import { Colors } from '../../constants';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
import {
  TopBar,
  PageContainer,
  BedManagementSearchBar,
  ContentPane,
  SearchTable,
} from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { usePatientSearch, PatientSearchKeys } from '../../contexts/PatientSearch';
import { columns } from './bedManagementColumns';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const DashboardItemListContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 4;
`;

const DashboardItemContainer = styled.div`
  height: 120px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0px 15px 10px 10px;
  margin-left: 1%;
  background-color: ${Colors.white};
  border-radius: 5px;
  border-left: 4px solid ${props => props.color || Colors.primaryDark};
  &:first-child {
    margin-left: 0;
  }
  flex: ${props => props.flex || 'auto'};
`;

const DashboardItemTitle = styled(Typography)`
  font-size: 24px;
  font-weight: 500;
  color: ${props => props.color || Colors.primaryDark};
`;

const DashboardItemDescription = styled(Typography)`
  white-space: pre-wrap;
  font-size: 14px;
  color: ${Colors.midText};
`;

const DetailedDashboardItemContainer = styled(DashboardItemContainer)`
  flex: 1;
  min-width: 220px;
  padding-left: 15px;
`;

const DetailedDashboardItemSection = styled.div`
  margin-left: 10px;
`;

const DetailedDashboardItemTextContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
`;

const DetailedDashboardItemTitle = styled(Typography)`
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.color || Colors.brightBlue};
  line-height: 26px;
`;

const DetailedDashboardItemText = styled(DashboardItemDescription)`
  line-height: 26px;
`;

const DetailedLoadingIndicator = () => (
  <LoadingIndicator backgroundColor="transparent" height="24px" width="20px" size="20px" />
);

const DashboardItem = ({ color, title, loading, description }) => {
  return (
    <DashboardItemContainer color={color}>
      {loading ? (
        <LoadingIndicator backgroundColor="transparent" height="3em" width="2em" size="2em" />
      ) : (
        <DashboardItemTitle color={color}>{title}</DashboardItemTitle>
      )}
      <DashboardItemDescription>{description}</DashboardItemDescription>
    </DashboardItemContainer>
  );
};

const DetailedDashboardItemNumber = ({ loading, value }) => {
  if (loading) return <DetailedLoadingIndicator />;
  return <DetailedDashboardItemTitle>{value || 0}</DetailedDashboardItemTitle>;
};

const DetailedDashboardItem = ({ api }) => {
  const {
    data: {
      data: { availableLocationCount, reservedLocationCount, occupiedLocationCount } = {},
    } = {},
    isLoading: patientLocationsLoading,
  } = useQuery(['patientLocations'], () => api.get('patient/locations/stats'));

  return (
    <DetailedDashboardItemContainer color={Colors.brightBlue}>
      <DetailedDashboardItemTextContainer>
        <div>
          <DetailedDashboardItemNumber
            loading={patientLocationsLoading}
            value={availableLocationCount}
          />
          <DetailedDashboardItemNumber
            loading={patientLocationsLoading}
            value={reservedLocationCount}
          />
          <DetailedDashboardItemNumber
            loading={patientLocationsLoading}
            value={occupiedLocationCount}
          />
        </div>
        <DetailedDashboardItemSection>
          <DetailedDashboardItemText>No. of locations available</DetailedDashboardItemText>
          <DetailedDashboardItemText>No. of locations reserved</DetailedDashboardItemText>
          <DetailedDashboardItemText>No. of locations occupied</DetailedDashboardItemText>
        </DetailedDashboardItemSection>
      </DetailedDashboardItemTextContainer>
    </DetailedDashboardItemContainer>
  );
};

export const BedManagement = () => {
  const api = useApi();
  const dispatch = useDispatch();
  const { facility } = useAuth();

  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.BedManagementView,
  );

  const {
    data: { count: totalCurrentPatientsCount } = {},
    isLoading: totalCurrentPatientsCountLoading,
  } = useQuery(['totalCurrentPatientsCount'], () =>
    api.get('patient', { countOnly: true, currentPatient: true, facilityId: ':local' }),
  );

  const {
    data: { count: currentInpatientsCount } = {},
    isLoading: currentInpatientsCountLoading,
  } = useQuery(['currentInpatientsCount'], () =>
    api.get('patient', {
      countOnly: true,
      currentPatient: true,
      inpatient: true,
      facilityId: ':local',
    }),
  );

  const { data: { data: currentOccupancy } = {}, isLoading: currentOccupancyLoading } = useQuery(
    ['currentOccupancy'],
    () => api.get('patient/locations/occupancy'),
  );

  const { data: { data: alos } = {}, isLoading: alosLoading } = useQuery(['alos'], () =>
    api.get('patient/locations/alos'),
  );

  const { data: { data: readmissionsCount } = {}, isLoading: readmissionsCountLoading } = useQuery(
    ['readmissionsCount'],
    () => api.get('patient/locations/readmissions'),
  );

  // hides hover for rows that arent clickable (do not have a patient to click to)
  const rowStyle = row =>
    (row.locationMaxOccupancy !== 1 || !row.patientId) &&
    '&:hover { background-color: transparent; cursor: default; }';

  const handleViewPatient = async row => {
    if (row.locationMaxOccupancy === 1) {
      const patientId = row.patientId || row.plannedPatientId;
      if (patientId) {
        await dispatch(reloadPatient(patientId));
        dispatch(push(`/patients/all/${patientId}`));
      }
    }
  };

  return (
    <PageContainer>
      <TopBar title="Bed management" subTitle={facility.name} />
      <ContentPane>
        <DashboardContainer>
          <DashboardItemListContainer>
            <DashboardItem
              title={totalCurrentPatientsCount || 0}
              loading={totalCurrentPatientsCountLoading}
              description={`Total current\npatients`}
            />
            <DashboardItem
              color={Colors.green}
              title={currentInpatientsCount || 0}
              loading={currentInpatientsCountLoading}
              description={`Current inpatient\nadmissions`}
            />
            <DashboardItem
              color={Colors.purple}
              title={`${Math.round((alos || 0) * 10) / 10} days`}
              loading={alosLoading}
              description={`Average length of\nstay (last 30 days)`}
            />
            <DashboardItem
              color={Colors.pink}
              title={`${Math.round((currentOccupancy || 0) * 10) / 10}%`}
              loading={currentOccupancyLoading}
              description={`Current\noccupancy`}
            />
            <DashboardItem
              color={Colors.metallicYellow}
              title={readmissionsCount || 0}
              loading={readmissionsCountLoading}
              description={`Readmission in\nlast 30 days`}
            />
          </DashboardItemListContainer>
          <DetailedDashboardItem api={api} />
        </DashboardContainer>
      </ContentPane>
      <ContentPane>
        <BedManagementSearchBar
          searchParameters={searchParameters}
          onSearch={setSearchParameters}
        />
        <SearchTable
          columns={columns}
          noDataMessage="No locations found"
          onRowClick={handleViewPatient}
          rowStyle={rowStyle}
          fetchOptions={searchParameters}
          endpoint="patient/locations/bedManagement"
        />
      </ContentPane>
    </PageContainer>
  );
};
