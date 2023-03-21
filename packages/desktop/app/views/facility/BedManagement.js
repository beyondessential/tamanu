import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants';

import { useApi } from '../../api';
import { TopBar, PageContainer, ContentPane } from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';

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

const DetailedDashboardItemElement = ({ loading, title }) => {
  if (loading) return <DetailedLoadingIndicator />;
  return <DetailedDashboardItemTitle>{title}</DetailedDashboardItemTitle>;
};

const DetailedDashboardItem = ({ api }) => {
  const {
    data: { data: { availableLocations, reservedLocations, occupiedLocations } = {} } = {},
    isLoading: patientLocationsLoading,
  } = useQuery(['patientLocations'], () => api.get('patient/locations/stats'));

  return (
    <DetailedDashboardItemContainer color={Colors.brightBlue}>
      <DetailedDashboardItemTextContainer>
        <div>
          <DetailedDashboardItemElement
            loading={patientLocationsLoading}
            title={availableLocations}
          />
          <DetailedDashboardItemElement
            loading={patientLocationsLoading}
            title={reservedLocations}
          />
          <DetailedDashboardItemElement
            loading={patientLocationsLoading}
            title={occupiedLocations}
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

  const {
    data: { count: totalCurrentPatients } = {},
    isLoading: totalCurrentPatientsLoading,
  } = useQuery(['totalCurrentPatients'], () =>
    api.get('patient', { countOnly: true, currentPatient: true }),
  );

  const {
    data: { count: currentInpatients } = {},
    isLoading: currentInpatientsLoading,
  } = useQuery(['currentInpatients'], () =>
    api.get('patient', { countOnly: true, currentPatient: true, inpatient: true }),
  );

  const { data: { data: currentOccupancy } = {}, isLoading: currentOccupancyLoading } = useQuery(
    ['currentOccupancy'],
    () => api.get('patient/locations/occupancy'),
  );

  return (
    <PageContainer>
      <TopBar title="Bed management" />
      <ContentPane>
        <DashboardContainer>
          <DashboardItemListContainer>
            <DashboardItem
              title={totalCurrentPatients}
              loading={totalCurrentPatientsLoading}
              description={`Total current\npatients`}
            />
            <DashboardItem
              color={Colors.green}
              title={currentInpatients}
              loading={currentInpatientsLoading}
              description={`Current inpatient\nadmissions`}
            />
            <DashboardItem
              color={Colors.purple}
              title="- days"
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
              title="-"
              description={`Readmission in\nlast 30 days`}
            />
          </DashboardItemListContainer>
          <DetailedDashboardItem api={api} />
        </DashboardContainer>
      </ContentPane>
    </PageContainer>
  );
};
