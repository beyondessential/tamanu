import React, { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { DisplayPatientRegDetails } from './DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from './ProgramRegistryStatusHistory';
import { usePatientProgramRegistrationQuery } from '../../api/queries/usePatientProgramRegistrationQuery';
import { PatientProgramRegistryFormHistory } from './PatientProgramRegistryFormHistory';
import { PatientProgramRegistrationSelectSurvey } from './PatientProgramRegistrationSelectSurvey';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionSection } from './ConditionSection';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';
import { TranslatedReferenceData, TranslatedText } from '../../components';

const ViewHeader = styled.div`
  background-color: ${Colors.white};
  border-bottom: 1px solid ${Colors.outline};
  padding: 15px 28px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  h1 {
    margin: 0;
    font-weight: 500;
    font-size: 16px;
  }
`;

const Container = styled.div`
  margin: 15px 10px;
`;

const MainSection = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 10px 20px;
`;

const Row = styled.div`
  margin: 20px 0;
`;

const Grid = styled.div`
  display: grid;
  grid-auto-columns: 1.3fr 1fr;
  gap: 10px;

  > div {
    height: 255px;

    &:first-child {
      grid-column: 1;
    }

    &:nth-child(2) {
      grid-column: 2;
  }
`;

export const PatientProgramRegistryView = () => {
  const queryParams = useUrlSearchParams();
  const title = queryParams.get('title');
  const { patientId, programRegistryId } = useParams();
  const { data, isLoading, isError } = usePatientProgramRegistrationQuery(
    patientId,
    programRegistryId,
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return <p>Program registry &apos;{title || 'Unknown'}&apos; not found.</p>;
  }

  return (
    <>
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
        <MainSection>
          <DisplayPatientRegDetails patientProgramRegistration={data} />
          <Grid>
            <ProgramRegistryStatusHistory />
            <ConditionSection />
          </Grid>
        </MainSection>
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
