import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Collapse, Divider, IconButton, ListItem, List, Typography } from '@material-ui/core';
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
  margin: 10px 30px 20px 30px;
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
`;

const EncounterTypeIndicator = styled.div`
  height: 75%;
  border-radius: 10px;
  width: 4px;
  margin-right: 5px;
`;

const RightArrowButton = styled(IconButton)`
  position: absolute;
  right: 0px;
  padding: 2px;
`;

const LeftArrowButton = styled(IconButton)`
  position: absolute;
  margin-left: -30px;
  padding: 2px;
`;

const colorFromEncounterType = {
  admission: '#19934E',
  clinic: '#CB6100',
  default: '#1172D1',
};

export const RecentlyViewedPatientsList = ({ encounterType }) => {
  const { navigateToPatient } = usePatientNavigation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  const dispatch = useDispatch();
  const api = useApi();

  const { data: { data: recentlyViewedPatients } = {} } = useQuery(['recentlyViewedPatients'], () =>
    api.get(
      `user/recently-viewed-patients${encounterType ? `?encounterType=${encounterType}` : ''}`,
    ),
  );

  const cardOnClick = useCallback(
    async patientId => {
      await dispatch(reloadPatient(patientId));
      navigateToPatient(patientId);
    },
    [dispatch, navigateToPatient],
  );

  return (
    recentlyViewedPatients?.length > 0 && (
      <>
        <Container>
          <ContainerTitle onClick={() => setIsExpanded(!isExpanded)}>
            <SectionLabel>Recently Viewed</SectionLabel>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </ContainerTitle>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <CardListContainer>
              {pageIndex > 0 && (
                <LeftArrowButton onClick={() => setPageIndex(0)}>
                  <NavigateBefore />
                </LeftArrowButton>
              )}
              <CardList>
                {recentlyViewedPatients
                  .slice(0 + pageIndex * 6, 6 + pageIndex * 6)
                  .map((patient, index) => (
                    <Card
                      key={patient.id}
                      onClick={() => cardOnClick(patient.id)}
                      style={!index ? { marginLeft: 0 } : undefined}
                    >
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
                        <CardText>DOB: {dateFnsFormat(new Date(patient.dateOfBirth), 'dd/MM/yy')}</CardText>
                      </div>
                    </Card>
                  ))}
              </CardList>
              {recentlyViewedPatients?.length > 6 && pageIndex === 0 && (
                <RightArrowButton onClick={() => setPageIndex(1)}>
                  <NavigateNext />
                </RightArrowButton>
              )}
            </CardListContainer>
          </Collapse>
          {!isExpanded && <ComponentDivider />}
        </Container>
      </>
    )
  );
}
