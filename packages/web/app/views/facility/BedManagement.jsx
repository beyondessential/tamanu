import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { Colors } from '../../constants';
import { TranslatedText, TranslatedReferenceData } from '@tamanu/ui-components';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
import {
  BedManagementSearchBar,
  ContentPane,
  PageContainer,
  SearchTable,
  TopBar,
} from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientSearchKeys, usePatientSearch } from '../../contexts/PatientSearch';
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
  <LoadingIndicator
    backgroundColor="transparent"
    height="24px"
    width="20px"
    size="20px"
    data-testid="loadingindicator-27wa"
  />
);

const DashboardItem = ({ color, title, loading, description }) => {
  return (
    <DashboardItemContainer color={color} data-testid="dashboarditemcontainer-ppiy">
      {loading ? (
        <LoadingIndicator
          backgroundColor="transparent"
          height="3em"
          width="2em"
          size="2em"
          data-testid="loadingindicator-5oeb"
        />
      ) : (
        <DashboardItemTitle style={{ color }} data-testid="dashboarditemtitle-f0nc">
          {title}
        </DashboardItemTitle>
      )}
      <DashboardItemDescription data-testid="dashboarditemdescription-1nsm">
        {description}
      </DashboardItemDescription>
    </DashboardItemContainer>
  );
};

const DetailedDashboardItemNumber = ({ loading, value }) => {
  if (loading) return <DetailedLoadingIndicator data-testid="detailedloadingindicator-e4xb" />;
  return (
    <DetailedDashboardItemTitle data-testid="detaileddashboarditemtitle-mhot">
      {value || 0}
    </DetailedDashboardItemTitle>
  );
};

const DetailedDashboardItem = ({ api, facilityId }) => {
  const {
    data: {
      data: { availableLocationCount, reservedLocationCount, occupiedLocationCount } = {},
    } = {},
    isLoading: patientLocationsLoading,
  } = useQuery(['patientLocations'], () =>
    api.get('patient/locations/stats', {
      facilityId,
    }),
  );

  return (
    <DetailedDashboardItemContainer
      color={Colors.brightBlue}
      data-testid="detaileddashboarditemcontainer-vscx"
    >
      <DetailedDashboardItemTextContainer data-testid="detaileddashboarditemtextcontainer-22iu">
        <div>
          <DetailedDashboardItemNumber
            loading={patientLocationsLoading}
            value={availableLocationCount}
            data-testid="detaileddashboarditemnumber-3enh"
          />
          <DetailedDashboardItemNumber
            loading={patientLocationsLoading}
            value={reservedLocationCount}
            data-testid="detaileddashboarditemnumber-3chs"
          />
          <DetailedDashboardItemNumber
            loading={patientLocationsLoading}
            value={occupiedLocationCount}
            data-testid="detaileddashboarditemnumber-exho"
          />
        </div>
        <DetailedDashboardItemSection data-testid="detaileddashboarditemsection-krv2">
          <DetailedDashboardItemText data-testid="detaileddashboarditemtext-2rj3">
            <TranslatedText
              stringId="bedManagement.dashboard.detailedItem.locationsAvailable.label"
              fallback="No. of locations available"
              data-testid="translatedtext-8cft"
            />
          </DetailedDashboardItemText>
          <DetailedDashboardItemText data-testid="detaileddashboarditemtext-ru9s">
            <TranslatedText
              stringId="bedManagement.dashboard.detailedItem.locationsReserved.label"
              fallback="No. of locations reserved"
              data-testid="translatedtext-5fjl"
            />
          </DetailedDashboardItemText>
          <DetailedDashboardItemText data-testid="detaileddashboarditemtext-4akl">
            <TranslatedText
              stringId="bedManagement.dashboard.detailedItem.locationsOccupied.label"
              fallback="No. of locations occupied"
              data-testid="translatedtext-fame"
            />
          </DetailedDashboardItemText>
        </DetailedDashboardItemSection>
      </DetailedDashboardItemTextContainer>
    </DetailedDashboardItemContainer>
  );
};

export const BedManagement = () => {
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { facilityId } = useAuth();

  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.BedManagementView,
  );

  // TODO: make sure these numbers properly reflect the numbers of the facility

  const {
    data: { count: totalCurrentPatientsCount } = {},
    isLoading: totalCurrentPatientsCountLoading,
  } = useQuery(['totalCurrentPatientsCount'], () =>
    api.get('patient', {
      countOnly: true,
      currentPatient: true,
      facilityId,
    }),
  );

  const {
    data: { count: currentInpatientsCount } = {},
    isLoading: currentInpatientsCountLoading,
  } = useQuery(['currentInpatientsCount'], () =>
    api.get('patient', {
      countOnly: true,
      currentPatient: true,
      inpatient: true,
      facilityId,
    }),
  );

  const { data: { data: currentOccupancy } = {}, isLoading: currentOccupancyLoading } = useQuery(
    ['currentOccupancy', facilityId],
    () => api.get('patient/locations/occupancy', { facilityId }),
  );

  const { data: { data: alos } = {}, isLoading: alosLoading } = useQuery(['alos', facilityId], () =>
    api.get('patient/locations/alos', { facilityId }),
  );

  const { data: { data: readmissionsCount } = {}, isLoading: readmissionsCountLoading } = useQuery(
    ['readmissionsCount', facilityId],
    () => api.get('patient/locations/readmissions', { facilityId }),
  );

  const { data: facility } = useQuery(['facility', facilityId], () =>
    api.get(`facility/${encodeURIComponent(facilityId)}`),
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
        navigate(`/patients/all/${patientId}`);
      }
    }
  };

  return (
    <PageContainer data-testid="pagecontainer-zfu3">
      <TopBar
        title={
          <TranslatedText
            stringId="bedManagement.title"
            fallback="Bed management"
            data-testid="translatedtext-6ncm"
          />
        }
        subTitle={
          <TranslatedReferenceData
            fallback={facility?.name}
            value={facility?.id}
            category="facility"
            data-testid="translatedreferencedata-nk31"
          />
        }
        data-testid="topbar-019l"
      />
      <ContentPane data-testid="contentpane-nltt">
        <DashboardContainer data-testid="dashboardcontainer-uvqg">
          <DashboardItemListContainer data-testid="dashboarditemlistcontainer-mbks">
            <DashboardItem
              title={totalCurrentPatientsCount || 0}
              loading={totalCurrentPatientsCountLoading}
              description={
                <TranslatedText
                  stringId="bedManagement.dashboard.item.currentPatients.label"
                  fallback="Total current\npatients"
                  data-testid="translatedtext-cgft"
                />
              }
              data-testid="dashboarditem-kqp6"
            />
            <DashboardItem
              color={Colors.green}
              title={currentInpatientsCount || 0}
              loading={currentInpatientsCountLoading}
              description={
                <TranslatedText
                  stringId="bedManagement.dashboard.item.currentInpatients.label"
                  fallback="Current inpatient\nadmissions"
                  data-testid="translatedtext-nw3v"
                />
              }
              data-testid="dashboarditem-mcfd"
            />
            <DashboardItem
              color={Colors.purple}
              title={`${Math.round((alos || 0) * 10) / 10} days`}
              loading={alosLoading}
              description={
                <TranslatedText
                  stringId="bedManagement.dashboard.item.averageStayDuration.label"
                  fallback="Average length of\nstay (last 30 days)"
                  data-testid="translatedtext-glc0"
                />
              }
              data-testid="dashboarditem-imw5"
            />
            <DashboardItem
              color={Colors.pink}
              title={`${Math.round((currentOccupancy || 0) * 10) / 10}%`}
              loading={currentOccupancyLoading}
              description={
                <TranslatedText
                  stringId="bedManagement.dashboard.item.currentOccupancy.label"
                  fallback="Current\noccupancy"
                  data-testid="translatedtext-a3y3"
                />
              }
              data-testid="dashboarditem-cwa5"
            />
            <DashboardItem
              color={Colors.metallicYellow}
              title={readmissionsCount || 0}
              loading={readmissionsCountLoading}
              description={
                <TranslatedText
                  stringId="bedManagement.dashboard.item.readmission.label"
                  fallback="Readmission in\nlast 30 days"
                  data-testid="translatedtext-s2tv"
                />
              }
              data-testid="dashboarditem-9xky"
            />
          </DashboardItemListContainer>
          <DetailedDashboardItem
            api={api}
            facilityId={facilityId}
            data-testid="detaileddashboarditem-bkgj"
          />
        </DashboardContainer>
      </ContentPane>
      <ContentPane data-testid="contentpane-9jv6">
        <BedManagementSearchBar
          searchParameters={searchParameters}
          onSearch={setSearchParameters}
          data-testid="bedmanagementsearchbar-z14p"
        />
        <SearchTable
          columns={columns}
          noDataMessage={
            <TranslatedText
              stringId="bedManagement.table.noData"
              fallback="No locations found"
              data-testid="translatedtext-a4s7"
            />
          }
          onRowClick={handleViewPatient}
          rowStyle={rowStyle}
          fetchOptions={{ ...searchParameters, facilityId }}
          endpoint="patient/locations/bedManagement"
          data-testid="searchtable-ir2h"
        />
      </ContentPane>
    </PageContainer>
  );
};
