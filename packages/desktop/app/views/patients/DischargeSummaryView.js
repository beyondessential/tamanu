import { ipcRenderer } from 'electron';

import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { TextButton, BackButton } from '../../components/Button';
import { DateDisplay } from '../../components/DateDisplay';
import { TopBar } from '../../components';

const PrintFriendlyTopbar = styled(TopBar)`
  button {
    width: max-content;

    @media print {
      display: none;
    }
  }
`;

const SummaryPage = styled.div`
  margin: 0 50px 50px 50px;
`;

const Label = styled.span`
  min-width: 200px;
  font-weight: 500;
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

const DumbDischargeSummaryView = React.memo(({ visit, patient, loading }) => {
  const primaryDiagnoses = visit.diagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = visit.diagnoses.filter(d => !d.isPrimary);

  return (
    <LoadingIndicator loading={loading}>
      <PrintFriendlyTopbar title="Patient Discharge Summary">
        <TextButton onClick={() => ipcRenderer.send('print-to-pdf')}>Print Summary</TextButton>
        <BackButton />
      </PrintFriendlyTopbar>
      <SummaryPage>
        <Header>
          <h4>
            <Label>Patient name: </Label>
            {patient.firstName} {patient.lastName}
          </h4>
          <h4>
            <Label>UID: </Label>
            {patient.externalPatientId}
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
              <div>{visit.examiner.displayName}</div>
            </TwoColumnSection>
            <TwoColumnSection>
              <Label>Discharge physician: </Label>
              <div>{visit.dischargePhysician.displayName}</div>
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

            <div>
              <Label>Discharge treatment plan and follow-up notes:</Label>
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
