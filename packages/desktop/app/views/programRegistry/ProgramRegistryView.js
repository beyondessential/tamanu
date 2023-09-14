import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { CircularProgress } from '@material-ui/core';
import { Colors, PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { useUrlQueryParams } from '../../hooks';
import { DisplayPatientRegDetails } from './DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from './ProgramRegistryStatusHistory';
import { usePatientProgramRegistry } from '../../api/queries/usePatientProgramRegistry';
import { ProgramRegistryFormHistory } from './ProgramRegistryFormHistory';
import { ProgramRegistrySelectSurvey } from './ProgramRegistrySelectSurvey';

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

const getFirstCharUpperCase = str => str.charAt(0).toUpperCase() + str.slice(1);

export const ProgramRegistryView = () => {
  const queryParams = useUrlQueryParams();
  const params = useParams();
  const title = queryParams.get('title');
  const patientId = params.patiendId || 'patient_id';
  const programRegistryId = params.programRegistryId || 'program_registry_id';

  const { data, isLoading, isError } = usePatientProgramRegistry(patientId, programRegistryId);

  if (isLoading) return <CircularProgress size="5rem" />;
  if (isError) return <p>Program registry &apos;{title || 'Unknown'}&apos; not found.</p>;

  return (
    <>
      <ViewHeader>
        <h1>{title || data.name}</h1>
        <StatusDiv>
          {data.registrationStatus === PROGRAM_REGISTRATION_STATUSES.ACTIVE ? (
            <StatusActiveDot />
          ) : (
            <StatusInactiveDot />
          )}
          <b>{getFirstCharUpperCase(data.registrationStatus)}</b>
        </StatusDiv>
      </ViewHeader>
      <Container>
        <Row>
          <DisplayPatientRegDetails patientProgramRegistration={data} />
        </Row>
        <Row>
          <ProgramRegistrySelectSurvey
            patientProgramRegistration={data}
            patient={{ id: patientId }}
          />
        </Row>
        <Row>
          <ProgramRegistryStatusHistory patientProgramRegistration={data} />
        </Row>
        <Row>
          <ProgramRegistryFormHistory
            patientProgramRegistration={data}
            patient={{ id: patientId }}
          />
        </Row>
      </Container>
    </>
  );
};
