import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { CircularProgress } from '@material-ui/core';
import { Colors } from '../../constants';
import { useUrlQueryParams } from '../../hooks';
import { DisplayPatientRegDetails } from './DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from './ProgramRegistryStatusHistory';
import { usePatientProgramRegistry } from '../../api/queries/usePatientProgramRegistry';

const ViewHeader = styled.div`
  background-color: ${Colors.white};
  border-bottom: 1px solid ${Colors.softOutline};
  padding: 20px 30px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  h1 {
    margin: 0px;
    font-weight: 500;
    font-size: 16px;
  }
`;

const Container = styled.div`
  margin: 20px 20px;
  // display: flex;
  // flex-direction: column;
  // justify-content: space-between;
  // align-items: center;
`;
const Row = styled.div`
  margin: 20px 0px;
`;
const StatusDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
`;
const StatusActiveDot = styled.div`
  background-color: green;
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin: 0px 5px;
`;
const StatusInactiveDot = styled.div`
  background-color: lightGray;
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin: 0px 5px;
`;
export const ProgramRegistryView = () => {
  const queryParams = useUrlQueryParams();
  const params = useParams();
  const title = queryParams.get('title');
  const programRegistryId = params.id;

  const { data, isLoading, isError } = usePatientProgramRegistry(programRegistryId);

  if (isLoading) return <CircularProgress size="5rem" />;
  else if (isError) return <p>Program registry '{title}' not found.</p>;
  else
    return (
      <>
        <ViewHeader>
          <h1></h1>
          <StatusDiv>
            <StatusActiveDot />
            <span>Active</span>
          </StatusDiv>
        </ViewHeader>
        <Container>
          <Row>
            <DisplayPatientRegDetails
              patientProgramRegistration={{
                date: '2023-08-28T02:40:16.237Z',
                programRegistryClinicalStatusId: '123123',
                programRegistryClinicalStatus: {
                  id: '123123',
                  code: 'low_risk',
                  name: 'Low risk',
                  color: 'green',
                },
                clinicianId: '213123',
                clinician: {
                  id: '213123',
                  displayName: 'Alaister',
                },
                removedById: '213123',
                removedBy: {
                  id: '213123',
                  displayName: 'Alaister',
                },
                registrationStatus: 'removed',
              }}
            />
          </Row>
          <Row>
            <ProgramRegistryStatusHistory />
          </Row>
        </Container>
      </>
    );
};
