import React, { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { DisplayPatientRegDetails } from './DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from './ProgramRegistryStatusHistory';
import { usePatientProgramRegistration } from '../../api/queries/usePatientProgramRegistration';
import { useProgramRegistryConditionsQuery } from '../../api/queries/usePatientProgramRegistryConditions';
import { PatientProgramRegistryFormHistory } from './PatientProgramRegistryFormHistory';
import { PatientProgramRegistrationSelectSurvey } from './PatientProgramRegistrationSelectSurvey';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionSection } from './ConditionSection';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';

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
export const PatientProgramRegistryView = () => {
  const queryParams = useUrlSearchParams();
  const title = queryParams.get('title');
  const { patientId, programRegistryId } = useParams();
  const { data, isLoading, isError } = usePatientProgramRegistration(patientId, programRegistryId);
  const { data: programRegistryConditions, isLoading: conditionsLoading } = useProgramRegistryConditionsQuery(
    data?.programRegistryId,
  );

  if (isLoading || conditionsLoading) return <LoadingIndicator />;
  if (isError) return <p>Program registry &apos;{title || 'Unknown'}&apos; not found.</p>;

  return (
    <Fragment key={data.id}>
      <ViewHeader>
        <h1>{data.programRegistry.name}</h1>
        <RegistrationStatusIndicator
          style={{ height: '10px', width: '10px' }}
          patientProgramRegistration={data}
        />
      </ViewHeader>
      <Container>
        <Row>
          <DisplayPatientRegDetails patientProgramRegistration={data} />
        </Row>
        <ProgramStatusAndConditionContainer>
          <ProgramRegistryStatusHistory
            patientProgramRegistration={data}
            programRegistryConditions={programRegistryConditions}
          />
          <ConditionSection
            patientProgramRegistration={data}
            programRegistryConditions={programRegistryConditions}
          />
        </ProgramStatusAndConditionContainer>

        <Row>
          <PatientProgramRegistrationSelectSurvey patientProgramRegistration={data} />
        </Row>
        <Row>
          <PatientProgramRegistryFormHistory patientProgramRegistration={data} />
        </Row>
      </Container>
    </Fragment>
  );
};
