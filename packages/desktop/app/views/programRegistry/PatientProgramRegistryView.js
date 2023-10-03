import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors, PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { useUrlQueryParams } from '../../hooks';
import { DisplayPatientRegDetails } from './DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from './ProgramRegistryStatusHistory';
import { usePatientProgramRegistration } from '../../api/queries/usePatientProgramRegistration';
import { PatientProgramRegistryFormHistory } from './PatientProgramRegistryFormHistory';
import { PatientProgramRegistrationSelectSurvey } from './PatientProgramRegistrationSelectSurvey';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionSection } from './ConditionSection';
import { capitaliseFirstLetter } from '../../utils/capitalise';

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
`;
const Row = styled.div`
  margin: 20px 0px;
`;

const ProgramStatusAndConditionContainer = styled.div`
  margin: 20px 0px;
  display: flex;
  flex-direction: row;
  justify-content: start;
  width: 100%;
  position: relative;
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

export const PatientProgramRegistryView = () => {
  const queryParams = useUrlQueryParams();
  const title = queryParams.get('title');
  const { patientId, programRegistryId } = useParams();
  const { data, isLoading, isError } = usePatientProgramRegistration(patientId, programRegistryId);

  if (isLoading) return <LoadingIndicator />;
  if (isError) return <p>Program registry &apos;{title || 'Unknown'}&apos; not found.</p>;

  return (
    <>
      <ViewHeader>
        <h1>{data.name}</h1>
        <StatusDiv>
          {data.registrationStatus === PROGRAM_REGISTRATION_STATUSES.ACTIVE ? (
            <StatusActiveDot />
          ) : (
            <StatusInactiveDot />
          )}
          <b>{capitaliseFirstLetter(data.registrationStatus)}</b>
        </StatusDiv>
      </ViewHeader>
      <Container>
        <Row>
          <DisplayPatientRegDetails patientProgramRegistration={data} />
        </Row>
        <ProgramStatusAndConditionContainer>
          <ProgramRegistryStatusHistory patientProgramRegistration={data} />
          <ConditionSection patientProgramRegistration={data} />
        </ProgramStatusAndConditionContainer>

        <Row>
          <PatientProgramRegistrationSelectSurvey patientProgramRegistration={data} />
        </Row>
        <Row>
          <PatientProgramRegistryFormHistory patientProgramRegistration={data} />
        </Row>
      </Container>
    </>
  );
};
