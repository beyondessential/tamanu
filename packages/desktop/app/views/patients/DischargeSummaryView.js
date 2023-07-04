import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';
import Box from '@material-ui/core/Box';

import { PrintPortal, PrintLetterhead } from '../../components/PatientPrinting';
import { LocalisedText } from '../../components/LocalisedText';
import { useApi } from '../../api';
import { Button } from '../../components/Button';
import { DateDisplay } from '../../components/DateDisplay';
import { useEncounter } from '../../contexts/Encounter';
import { Colors } from '../../constants';
import { useCertificate } from '../../utils/useCertificate';

const Container = styled.div`
  background: ${Colors.white};
  height: 100%;
`;

const SummaryPageContainer = styled.div`
  margin: 0 auto;
  max-width: 830px;
`;

const Label = styled.span`
  min-width: 200px;
  font-weight: 500;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 100px;
`;

const Header = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 100px;
  margin: 50px 0 20px 0;
`;

const HorizontalLine = styled.div`
  margin: 20px 0;
  border-top: 1px solid ${Colors.primaryDark};
`;

const ListColumn = styled.div`
  display: flex;
  flex-direction: column;

  ul {
    margin: 0;
    padding-left: 20px;
  }
`;

const NavContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

const IdValue = styled.span`
  font-weight: normal;
`;

const DiagnosesList = ({ diagnoses }) => {
  if (diagnoses.length === 0) {
    return <span>N/A</span>;
  }

  return diagnoses.map(item => (
    <li>
      {item.diagnosis.name} (<Label>ICD 10 Code: </Label> {item.diagnosis.code})
    </li>
  ));
};

const ProceduresList = ({ procedures }) => {
  if (!procedures || procedures.length === 0) {
    return <span>N/A</span>;
  }

  return procedures.map(procedure => (
    <li>
      {procedure.procedureType.name} (<Label>CPT Code: </Label> {procedure.procedureType.code})
    </li>
  ));
};

const MedicationsList = ({ medications }) => {
  if (!medications || medications.length === 0) {
    return <span>N/A</span>;
  }

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

const SummaryPage = React.memo(({ encounter, discharge }) => {
  const { title, subTitle, logo } = useCertificate();

  const patient = useSelector(state => state.patient);

  const {
    diagnoses,
    procedures,
    medications,
    startDate,
    endDate,
    location,
    examiner,
    reasonForEncounter,
  } = encounter;

  const primaryDiagnoses = diagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = diagnoses.filter(d => !d.isPrimary);

  return (
    <SummaryPageContainer>
      <PrintLetterhead
        title={title}
        subTitle={subTitle}
        logoSrc={logo}
        pageTitle="Patient Discharge Summary"
      />
      <Header>
        <h4>
          <Label>Patient name: </Label>
          <span>{`${patient.firstName} ${patient.lastName}`}</span>
        </h4>
        <h4>
          <Label>
            <LocalisedText path="fields.displayId.shortLabel" />:{' '}
          </Label>
          <IdValue>{patient.displayId}</IdValue>
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
        {discharge && (
          <div>
            <Label>Discharge disposition: </Label>
            {discharge.disposition?.name}
          </div>
        )}
        <div />
      </Content>
      <HorizontalLine />
      <Content>
        <div>
          <Label>Supervising physician: </Label>
          <span>{examiner?.displayName}</span>
        </div>
        <div />
        <div>
          <Label>Discharging physician: </Label>
          <span>{discharge?.discharger?.displayName}</span>
        </div>
        <div />
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
          <div style={{ whiteSpace: 'pre-wrap' }}>{discharge?.note}</div>
        </div>
      </Content>
    </SummaryPageContainer>
  );
});

export const DischargeSummaryView = React.memo(() => {
  const api = useApi();
  const [discharge, setDischarge] = useState(null);
  const { encounter } = useEncounter();

  useEffect(() => {
    (async () => {
      if (encounter?.id) {
        const data = await api.get(`encounter/${encounter?.id}/discharge`);
        setDischarge(data);
      }
    })();
  }, [api, encounter?.id]);

  // If there is no encounter loaded then this screen can't be displayed
  if (!encounter?.id) {
    return <Redirect to="/patients/all" />;
  }

  return (
    <Container>
      <NavContainer>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          // onClick={() => printPage()}
          startIcon={<PrintIcon />}
        >
          Print Summary
        </Button>
      </NavContainer>
      <SummaryPage encounter={encounter} discharge={discharge} />
      <PrintPortal>
        <Box p={5}>
          <SummaryPage encounter={encounter} discharge={discharge} />
        </Box>
      </PrintPortal>
    </Container>
  );
});
