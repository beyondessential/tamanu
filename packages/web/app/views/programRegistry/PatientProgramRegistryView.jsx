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
  } = useProgramRegistryConditionsQuery(data?.programRegistryId);

  const patientRoutes = usePatientRoutes();

  if (isLoading || conditionsLoading) {
    return <LoadingIndicator data-testid='loadingindicator-izzm' />;
  }

  if (isError) {
    return (
      <p>
        <TranslatedText
          stringId="programRegistry.registryNotFoundMessage"
          fallback="Program registry not found."
          data-testid='translatedtext-bj29' />
      </p>
    );
  }

  const conditionOptions = programRegistryConditions.map(x => ({
    label: x.name,
    value: x.id,
  }));

  return (
    <>
      <PatientNavigation patientRoutes={patientRoutes} data-testid='patientnavigation-j8qg' />
      <ViewHeader data-testid='viewheader-4dtc'>
        <h1>
          <TranslatedReferenceData
            fallback={data.programRegistry.name}
            value={data.programRegistry.id}
            category="programRegistry"
            data-testid='translatedreferencedata-890x' />
        </h1>
        <RegistrationStatusIndicator
          style={{ height: '10px', width: '10px' }}
          patientProgramRegistration={data}
          data-testid='registrationstatusindicator-7uco' />
      </ViewHeader>
      <Container data-testid='container-i17a'>
        <Row data-testid='row-7bbb'>
          <DisplayPatientRegDetails
            patientProgramRegistration={data}
            data-testid='displaypatientregdetails-wtse' />
        </Row>
        <ProgramStatusAndConditionContainer data-testid='programstatusandconditioncontainer-hjoo'>
          <ProgramRegistryStatusHistory
            patientProgramRegistration={data}
            programRegistryConditions={conditionOptions}
            data-testid='programregistrystatushistory-zrim' />
          <ConditionSection
            patientProgramRegistration={data}
            programRegistryConditions={conditionOptions}
            data-testid='conditionsection-ld8c' />
        </ProgramStatusAndConditionContainer>
        <Row data-testid='row-5cpu'>
          <PatientProgramRegistrationSelectSurvey
            patientProgramRegistration={data}
            data-testid='patientprogramregistrationselectsurvey-afbi' />
        </Row>
        <Row data-testid='row-50rl'>
          <PatientProgramRegistryFormHistory
            patientProgramRegistration={data}
            data-testid='patientprogramregistryformhistory-8lqp' />
        </Row>
      </Container>
    </>
  );
};
