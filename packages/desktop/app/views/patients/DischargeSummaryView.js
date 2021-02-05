/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { printPage, PrintPortal } from '../../print';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { TextButton, BackButton } from '../../components/Button';
import { DateDisplay } from '../../components/DateDisplay';
import { TopBar } from '../../components';
import { connectApi } from '../../api';

const SummaryPageContainer = styled.div`
  margin: 0 50px 50px 50px;
`;

const Label = styled.span`
  min-width: 200px;
  font-weight: 500;
`;

const StyledBackButton = styled(BackButton)`
  width: fit-content;
`;

const Centered = styled.div`
  text-align: center;
`;

const Content = styled.div`
  text-align: left;
  display: inline-block;
`;

const Header = styled.section`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;

  p,
  h4:first-child {
    margin-right: 30px;
  }
`;

const TwoColumnSection = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 10px;
  margin: 20px 0;
`;

const ListColumn = styled.div`
  display: flex;
  flex-direction: column;

  ul {
    margin: 0;
    padding-left: 20px;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;

  div:first-of-type {
    margin-right: 10px;
  }
`;

const DiagnosesList = ({ diagnoses }) => {
  if (diagnoses.length === 0) return <span>N/A</span>;

  return diagnoses.map(item => {
    return (
      <li>
        {item.diagnosis.name} (<Label>ICD 10 Code: </Label> {item.diagnosis.code})
      </li>
    );
  });
};

const ProceduresList = ({ procedures }) => {
  if (!procedures || procedures.length === 0) return <span>N/A</span>;

  return procedures.map(procedure => {
    return (
      <li>
        {procedure.description} (<Label>CPT Code: </Label> {procedure.cptCode})
      </li>
    );
  });
};

const MedicationsList = ({ medications }) => {
  if (!medications || medications.length === 0) return <span>N/A</span>;

  return medications.map(({ drug, prescription }) => (
    <li>
      <span>{drug.name}</span>
      {prescription && (
        <span>
          <br />
          {prescription}
        </span>
      )}
    </li>
  ));
};

const SummaryPage = React.memo(
  ({ patient, encounter, procedures, medications, diagnoses = [] }) => {
    const primaryDiagnoses = diagnoses.filter(d => d.isPrimary);
    const secondaryDiagnoses = diagnoses.filter(d => !d.isPrimary);

    return (
      <SummaryPageContainer>
        <Header>
          <h4>
            <Label>Patient name: </Label>
            <span>{`${patient.firstName} ${patient.lastName}`}</span>
          </h4>
          <h4>
            <Label>UID: </Label>
            <span>{patient.displayId}</span>
          </h4>
        </Header>

        <Centered>
          <Content>
            <Row>
              <div>
                <Label>Admission date: </Label>
                <DateDisplay date={encounter.startDate} />
              </div>
              <div>
                <Label>Discharge date: </Label>
                <DateDisplay date={encounter.endDate} />
              </div>
            </Row>

            <div>
              <Label>Department: </Label>
              {encounter.location && encounter.location.name}
            </div>

            <hr />

            <TwoColumnSection>
              <Label>Supervising physician: </Label>
              <div>{encounter.examiner && encounter.examiner.displayName}</div>
            </TwoColumnSection>
            <TwoColumnSection>
              <Label>Discharge physician: </Label>
              <div>{encounter.dischargePhysician && encounter.dischargePhysician.displayName}</div>
            </TwoColumnSection>

            <hr />

            <TwoColumnSection>
              <Label>Reason for encounter: </Label>
              <div>{encounter.reasonForEncounter}</div>
            </TwoColumnSection>

            <TwoColumnSection>
              <Label>Primary diagnoses: </Label>
              <ListColumn>
                <ul>
                  <DiagnosesList diagnoses={primaryDiagnoses} />
                </ul>
              </ListColumn>
            </TwoColumnSection>

            <TwoColumnSection>
              <Label>Secondary diagnoses: </Label>
              <ListColumn>
                <ul>
                  <DiagnosesList diagnoses={secondaryDiagnoses} />
                </ul>
              </ListColumn>
            </TwoColumnSection>

            <TwoColumnSection>
              <Label>Procedures: </Label>
              <ListColumn>
                <ul>
                  <ProceduresList procedures={procedures} />
                </ul>
              </ListColumn>
            </TwoColumnSection>

            <TwoColumnSection>
              <Label>Medications: </Label>
              <ListColumn>
                <ul>
                  <MedicationsList medications={medications} />
                </ul>
              </ListColumn>
            </TwoColumnSection>

            <div>
              <Label>Discharge planning notes:</Label>
              <div>{encounter.dischargeNotes}</div>
            </div>
          </Content>
        </Centered>
      </SummaryPageContainer>
    );
  },
);

const DumbDischargeSummaryView = React.memo(
  ({ encounter, patient, loading, onFetchDiagnoses, onFetchMedications, onFetchProcedures }) => {
    if (loading) return <LoadingIndicator />;
    const [procedures, setProcedures] = useState([]);
    const [medications, setMedications] = useState([]);
    const [diagnoses, setDiagnoses] = useState([]);
    useEffect(() => {
      async function fetchEncounterData() {
        const procedure = await onFetchProcedures();
        setProcedures(procedure.data);

        const medication = await onFetchMedications();
        setMedications(medication.data);

        const diagnosis = await onFetchDiagnoses();
        setDiagnoses(diagnosis.data);
      }
      fetchEncounterData();
    }, [encounter]);

    return (
      <TopBar title="Patient Discharge Summary">
        <TextButton onClick={printPage}>Print Summary</TextButton>
        <StyledBackButton to="/patients/encounter" />
        <SummaryPage patient={patient} encounter={encounter} />
        <PrintPortal>
          <SummaryPage
            patient={patient}
            encounter={encounter}
            procedures={procedures}
            medications={medications}
            diagnoses={diagnoses}
          />
        </PrintPortal>
      </TopBar>
    );
  },
);

export const DischargeSummaryView = connectApi((api, dispatch, { encounter, patient }) => ({
  onFetchDiagnoses: async () => api.get(`encounter/${encounter.id}/diagnoses`),
  onFetchProcedures: async () => api.get(`encounter/${encounter.id}/procedures`),
  onFetchMedications: async () => api.get(`encounter/${encounter.id}/medications`),
  loading: encounter.loading,
  encounter,
  patient,
}))(DumbDischargeSummaryView);
