import React, { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { DisplayPatientRegDetails } from './DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from './ProgramRegistryStatusHistory';
import { usePatientProgramRegistrationQuery } from '../../api/queries/usePatientProgramRegistrationQuery';
import { useProgramRegistryConditionsQuery } from '../../api/queries/usePatientProgramRegistryConditionsQuery';
import { PatientProgramRegistryFormHistory } from './PatientProgramRegistryFormHistory';
import { PatientProgramRegistrationSelectSurvey } from './PatientProgramRegistrationSelectSurvey';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionSection } from './ConditionSection';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';
import { TranslatedReferenceData, TranslatedText } from '../../components';
import { PatientNavigation } from '../../components/PatientNavigation';
import { usePatientRoutes } from '../../routes/PatientRoutes';

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
  const { patientId, programRegistryId } = useParams();
  const { data, isLoading, isError } = usePatientProgramRegistrationQuery(
    patientId,
    programRegistryId,
  );
  const {
    data: programRegistryConditions = [],
    isLoading: conditionsLoading,
  } = useProgramRegistryConditionsQuery(programRegistryId);

  const patientRoutes = usePatientRoutes();

  if (isLoading || conditionsLoading) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return (
      <p>
        <TranslatedText
          stringId="programRegistry.registryNotFoundMessage"
          fallback="Program registry not found."
        />
      </p>
    );
  }

  const conditionOptions = programRegistryConditions.map(x => ({
    label: x.name,
    value: x.id,
  }));

  return (
    <>
      <PatientNavigation patientRoutes={patientRoutes} />
      <ViewHeader>
        <h1>
          <TranslatedReferenceData
            fallback={data.programRegistry.name}
            value={data.programRegistry.id}
            category="programRegistry"
          />
        </h1>
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
            programRegistryConditions={conditionOptions}
          />
          <ConditionSection
            patientProgramRegistration={data}
            programRegistryConditions={conditionOptions}
          />
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
