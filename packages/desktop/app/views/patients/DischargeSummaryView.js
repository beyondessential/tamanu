import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { printPage } from '../../print';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { TextButton, BackButton } from '../../components/Button';
import { DateDisplay } from '../../components/DateDisplay';
import { TopBar } from '../../components';

const SummaryPage = styled.div`
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
        {item.diagnosis.name} (<Label>ICD 10 Code: </Label>
        {item.diagnosis.code})
      </li>
    );
  });
};

const ProceduresList = ({ procedures }) => {
  if (procedures.length === 0) return <span>N/A</span>;

  return procedures.map(procedure => {
    return (
      <li>
        {procedure.description} (<Label>CPT Code: </Label>
        {procedure.cptCode})
      </li>
    );
  });
};

const MedicationsList = ({ medications }) => {
  if (medications.length === 0) return <span>N/A</span>;

  return medications.map(({ drug, prescription }) => (
    <li>
      <span>{drug.name}</span>
      {prescription && <span><br />{prescription}</span>}
    </li>
  ));
};

const DumbDischargeSummaryView = React.memo(({ visit, patient, loading }) => {
  const primaryDiagnoses = visit.diagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = visit.diagnoses.filter(d => !d.isPrimary);

  return (
    <LoadingIndicator loading={loading}>
      <TopBar title="Patient Discharge Summary">
        <TextButton onClick={printPage}>Print Summary</TextButton>
        <StyledBackButton to="/patients/visit" />
      </TopBar>
      <SummaryPage>
        <Header>
          <h4>
            <Label>Patient name: </Label>
            <span>{patient.firstName} {patient.lastName}</span>
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
                <DateDisplay date={visit.startDate} />
              </div>
              <div>
                <Label>Discharge date: </Label>
                <DateDisplay date={visit.endDate} />
              </div>
            </Row>

            <div>
              <Label>Department: </Label>
              {visit.location && visit.location.name}
            </div>

            <hr />

            <TwoColumnSection>
              <Label>Supervising physician: </Label>
              <div>{visit.examiner && visit.examiner.displayName}</div>
            </TwoColumnSection>
            <TwoColumnSection>
              <Label>Discharge physician: </Label>
              <div>{visit.dischargePhysician && visit.dischargePhysician.displayName}</div>
            </TwoColumnSection>

            <hr />

            <TwoColumnSection>
              <Label>Reason for visit: </Label>
              <div>{visit.reasonForVisit}</div>
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
                  <ProceduresList procedures={visit.procedures} />
                </ul>
              </ListColumn>
            </TwoColumnSection>

            <TwoColumnSection>
              <Label>Medications: </Label>
              <ListColumn>
                <ul>
                  <MedicationsList medications={visit.medications} />
                </ul>
              </ListColumn>
            </TwoColumnSection>

            <div>
              <Label>Discharge planning notes:</Label>
              <div>{visit.dischargeNotes}</div>
            </div>
          </Content>
        </Centered>
      </SummaryPage>
    </LoadingIndicator>
  );
});

export const DischargeSummaryView = connect(state => ({
  loading: state.visit.loading,
  visit: state.visit,
  patient: state.patient,
}))(DumbDischargeSummaryView);
