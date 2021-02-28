/* eslint-disable react/jsx-one-expression-per-line */
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';

import { printPage, PrintPortal } from '../../print';

import { BackButton, Button } from '../../components/Button';
import { DateDisplay } from '../../components/DateDisplay';
import { TopBar } from '../../components';
import { useEncounter } from '../../contexts/Encounter';
import { PrintLetterhead } from '../../components/PrintLetterhead';
import { Colors } from '../../constants';

const SummaryPageContainer = styled.div`
  position: relative;
  margin: 0 auto;
  max-width: 830px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Label = styled.span`
  min-width: 200px;
  font-weight: 500;
`;

const StyledBackButton = styled(BackButton)`
  width: fit-content;
  margin: 24px 0;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 0 50px;
  grid-column-gap: 100px;
  width: 100%;
`;

const Header = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 50px 50px 20px 50px;
  grid-column-gap: 100px;
  width: 100%;
`;

const HorizontalLine = styled.div`
  margin: 20px 50px;
  border-top: 1px solid ${Colors.primaryDark};
  width: 100%;
`;

const ListColumn = styled.div`
  display: flex;
  flex-direction: column;

  ul {
    margin: 0;
    padding-left: 20px;
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

  return medications.map(({ medication, prescription }) => (
    <li>
      <span>{medication.name}</span>
      {prescription && (
        <span>
          <br />
          {prescription}
        </span>
      )}
    </li>
  ));
};

const SummaryPage = React.memo(({ patient, encounter }) => {
  const {
    diagnoses,
    procedures,
    medications,
    startDate,
    endDate,
    location,
    examiner,
    dischargePhysician,
    reasonForEncounter,
    dischargeNotes,
  } = encounter;
  const primaryDiagnoses = diagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = diagnoses.filter(d => !d.isPrimary);

  return (
    <SummaryPageContainer>
      <PrintLetterhead />
      <Header>
        <h4>
          <Label>Patient name: </Label>
          <span>{`${patient.firstName} ${patient.lastName}`}</span>
        </h4>
        <h4>
          <Label>NHN: </Label>
          <span>{patient.displayId}</span>
        </h4>
      </Header>

      <Content>
        <div>
          <Label>Admission date: </Label>
          <DateDisplay date={startDate} />
        </div>
        <div>
          <Label>Discharge date: </Label>
          <DateDisplay date={endDate} />
        </div>

        <div>
          <Label>Department: </Label>
          {location && location.name}
        </div>
        <div />
      </Content>

      <HorizontalLine />

      <Content>
        <Label>Supervising physician: </Label>
        <div>{examiner && examiner.displayName}</div>
        <Label>Discharge physician: </Label>
        <div>{dischargePhysician && dischargePhysician.displayName}</div>
      </Content>

      <HorizontalLine />

      <Content>
        <Label>Reason for encounter: </Label>
        <div>{reasonForEncounter}</div>

        <Label>Primary diagnoses: </Label>
        <ListColumn>
          <ul>
            <DiagnosesList diagnoses={primaryDiagnoses} />
          </ul>
        </ListColumn>

        <Label>Secondary diagnoses: </Label>
        <ListColumn>
          <ul>
            <DiagnosesList diagnoses={secondaryDiagnoses} />
          </ul>
        </ListColumn>

        <Label>Procedures: </Label>
        <ListColumn>
          <ul>
            <ProceduresList procedures={procedures} />
          </ul>
        </ListColumn>

        <Label>Medications: </Label>
        <ListColumn>
          <ul>
            <MedicationsList medications={medications} />
          </ul>
        </ListColumn>

        <div>
          <Label>Discharge planning notes:</Label>
          <div>{dischargeNotes}</div>
        </div>
        <div />
      </Content>
    </SummaryPageContainer>
  );
});

const NavContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 20px;
`;

const DumbDischargeSummaryView = React.memo(({ patient }) => {
  const { encounter } = useEncounter();

  return (
    <>
      <TopBar title="Patient Discharge Summary"></TopBar>
      <NavContainer>
        <StyledBackButton to="/patients/encounter" />
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={printPage}
          startIcon={<PrintIcon />}
        >
          Print Summary
        </Button>
      </NavContainer>
      <SummaryPage patient={patient} encounter={encounter} />
      <PrintPortal>
        <SummaryPage patient={patient} encounter={encounter} />
      </PrintPortal>
    </>
  );
});

export const DischargeSummaryView = connect(state => ({
  patient: state.patient,
}))(DumbDischargeSummaryView);
