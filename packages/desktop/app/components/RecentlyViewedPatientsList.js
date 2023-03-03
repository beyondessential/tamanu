import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Collapse, Divider, IconButton, ListItem, Typography } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { ExpandMore, ExpandLess, NavigateBefore, NavigateNext } from '@material-ui/icons';
import { format as dateFnsFormat } from 'date-fns';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { reloadPatient } from '../store/patient';
import { useApi } from '../api';
import { Colors } from '../constants';

const ComponentDivider = styled(Divider)`
  margin-top: 10px;
  background-color: ${Colors.outline};
`;

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  letter-spacing: 0;
  text-transform: none;
  text-decoration: none;
`;

const Card = styled.div`
  padding: 10px;
  padding-bottom: 15px;
  width: 16%;
  margin-left: 1%;
  background-color: white;
  border-radius: 3px;
  display: flex;
  flex-direction: row;
  cursor: pointer;
  &:hover {
    background-color: ${Colors.hoverGrey};
  }
  &:first-child {
    margin-left: 0;
  }
`;

const CardList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-top: 10px;
`;

const CardListContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const CardTitle = styled(Typography)`
  font-weight: bold;
  font-size: 14px;
`;

const CardText = styled(Typography)`
  font-size: 14px;
`;

const Container = styled(ListItem)`
  margin: 10px 0px 20px 0px;
  display: inherit;
  position: inherit;
  padding: 0;
  &.MuiListItem-root {
    width: auto;
  }
`;

const ContainerTitle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  margin-left: 30px;
`;

const EncounterTypeIndicator = styled.div`
  height: 75%;
  border-radius: 10px;
  width: 4px;
  margin-right: 5px;
`;

const RightArrowButton = styled(IconButton)`
  padding: 2px;
`;

const LeftArrowButton = styled(IconButton)`
  padding: 2px;
`;

const MarginDiv = styled.div`
  width: 30px;
`;

const colorFromEncounterType = {
  admission: '#19934E',
  clinic: '#E9AC50',
  triage: '#CB6100',
  default: '#1172D1',
};

const PATIENTS_PER_PAGE = 6;

export const RecentlyViewedPatientsList = ({ encounterType }) => {
  const { navigateToPatient } = usePatientNavigation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  const dispatch = useDispatch();
  const api = useApi();

  const { data: { data: recentlyViewedPatients } = {} } = useQuery(['recentlyViewedPatients'], () =>
    api.get('user/recently-viewed-patients', { encounterType }),
  );

  const pageCount = Math.floor(recentlyViewedPatients?.length / PATIENTS_PER_PAGE);
  const changePage = delta => setPageIndex(Math.max(0, Math.min(pageCount - 1, pageIndex + delta)));

  const cardOnClick = useCallback(
    async patientId => {
      await dispatch(reloadPatient(patientId));
      navigateToPatient(patientId);
    },
    [dispatch, navigateToPatient],
  );

  if (!recentlyViewedPatients?.length) {
    return null;
  }

  return (
    <Container>
      <ContainerTitle onClick={() => setIsExpanded(!isExpanded)}>
        <SectionLabel>Recently Viewed</SectionLabel>
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </ContainerTitle>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <CardListContainer>
          {pageIndex > 0 ? (
            <LeftArrowButton onClick={() => setPageIndex(0)}>
              <NavigateBefore />
            </LeftArrowButton>
          ) : (
            <MarginDiv />
          )}
          <CardList>
            {recentlyViewedPatients
              .slice(pageIndex * PATIENTS_PER_PAGE, (pageIndex + 1) * PATIENTS_PER_PAGE)
              .map(patient => (
                <Card key={patient.id} onClick={() => cardOnClick(patient.id)}>
                  <EncounterTypeIndicator
                    style={{
                      backgroundColor:
                        colorFromEncounterType[patient.encounter_type || 'default'] ||
                        colorFromEncounterType.default,
                    }}
                  />
                  <div>
                    <CardTitle
                      style={{
                        color:
                          colorFromEncounterType[patient.encounter_type || 'default'] ||
                          colorFromEncounterType.default,
                      }}
                    >
                      {patient.firstName} {patient.lastName}
                    </CardTitle>
                    <CardText>{patient.displayId}</CardText>
                    <CardText style={{ textTransform: 'capitalize' }}>{patient.sex}</CardText>
                    <CardText>
                      DOB: {dateFnsFormat(new Date(patient.dateOfBirth), 'dd/MM/yy')}
                    </CardText>
                  </div>
                </Card>
              ))}
          </CardList>
          {pageIndex < pageCount - 1 ? (
            <RightArrowButton onClick={() => changePage(1)}>
              <NavigateNext />
            </RightArrowButton>
          ) : (
            <MarginDiv />
          )}
        </CardListContainer>
      </Collapse>
      {!isExpanded && <ComponentDivider />}
    </Container>
  );
};
