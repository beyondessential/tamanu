import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';
import Box from '@material-ui/core/Box';

import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from 'shared/constants';

import { PrintPortal, PrintLetterhead } from '../../components/PatientPrinting';
import { LocalisedText } from '../../components/LocalisedText';
import { useApi, isErrorUnknownAllow404s } from '../../api';
import { Button } from '../../components/Button';
import { DateDisplay, formatShort } from '../../components/DateDisplay';
import { useEncounter } from '../../contexts/Encounter';
import { useElectron } from '../../contexts/Electron';
import { Colors } from '../../constants';
import { useCertificate } from '../../utils/useCertificate';
import { getFullLocationName } from '../../utils/location';
import { getDisplayAge } from '../../utils/dateTime';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { useLocalisation } from '../../contexts/Localisation';
import { usePatientAdditionalData, usePatientConditions } from '../../api/queries';

const Container = styled.div`
  background: ${Colors.white};
  height: 100%;
`;

const SummaryPageContainer = styled.div`
  margin: 0 auto;
  max-width: 830px;
`;

const Label = styled.span`
  font-weight: 600;
  font-size: 10px;
  vertical-align: top;
`;

const Text = styled(Label)`
  font-weight: 400;
`;

const Section = styled(Box)`
  padding-bottom: 10px;
`;

const Note = styled.p`
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 10px;
  border: 1px solid black;
  margin: 0;
  padding: 8px 10px;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 100px;
`;

const Header = styled.div`
  font-size: 12px;
  line-height: 14px;
  font-weight: 600;
`;

const HorizontalLine = styled.div`
  margin: 5px 0;
  border-top: 1px solid ${Colors.primaryDark};
`;

const ListColumn = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  li {
    font-size: 10px;
    padding-left: 0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  border-top: 1px solid black;
  border-left: 1px solid black;
`;

const InnerGrid = styled(Grid)`
  border: none;
`;

const GridItem = styled.div`
  border-right: 1px solid black;
  border-bottom: 1px solid black;
  padding: 8px 10px;
`;

const NavContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

const DiagnosesList = ({ diagnoses }) => {
  const { getLocalisation } = useLocalisation();

  if (diagnoses.length === 0) {
    return <span>N/A</span>;
  }

  const displayIcd10Codes = getLocalisation('features.displayIcd10CodesInDischargeSummary');

  return diagnoses
    .filter(({ certainty }) => !DIAGNOSIS_CERTAINTIES_TO_HIDE.includes(certainty))
    .map(item => (
      <li>
        {item.diagnosis.name}
        {displayIcd10Codes && <span>{` (${item.diagnosis.code})`}</span>}
      </li>
    ));
};

const ProceduresList = ({ procedures }) => {
  const { getLocalisation } = useLocalisation();

  if (!procedures || procedures.length === 0) {
    return <span>N/A</span>;
  }

  const displayProcedureCodes = getLocalisation('features.displayProcedureCodesInDischargeSummary');

  return procedures.map(procedure => (
    <li>
      {procedure.procedureType.name}
      {displayProcedureCodes && <span>{` (${procedure.procedureType.code})`}</span>}
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

  const { getLocalisation } = useLocalisation();
  const dischargeDispositionVisible =
    getLocalisation('fields.dischargeDisposition.hidden') === false;

  const patient = useSelector(state => state.patient);
  const { data: patientAdditionalData } = usePatientAdditionalData(patient.id);
  const { data: patienConditionsData } = usePatientConditions(patient.id);
  const patientConditions = (patienConditionsData?.data || [])
    .filter(p => !p.resolved)
    .map(p => p.condition.name)
    .sort((a, b) => a > b);

  const { streetVillage, cityTown, country } = patientAdditionalData;
  let address = null;
  if (streetVillage && cityTown && country) {
    address = `${streetVillage}, ${cityTown}, ${country.name}`;
  }

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
      <Section>
        <Header>Patient details</Header>
        <HorizontalLine />
        <Content>
          <div>
            <Label>Patient name: </Label>
            <Text>{`${patient.firstName} ${patient.lastName}`}</Text>
          </div>
          <div>
            <Label>
              <LocalisedText path="fields.displayId.shortLabel" />:{' '}
            </Label>
            <Text>{patient.displayId}</Text>
          </div>
          <div>
            <Label>DOB: </Label>
            <Text>
              {`${formatShort(patient.dateOfBirth)} (${getDisplayAge(patient.dateOfBirth)})`}
            </Text>
          </div>
          <div>
            <Label>Address: </Label>
            <Text>{`${address}`}</Text>
          </div>
          <div>
            <Label>Sex: </Label>
            <Text>{`${capitaliseFirstLetter(patient.sex)}`}</Text>
          </div>
          <div>
            <Label>Village: </Label>
            <Text>{`${cityTown}`}</Text>
          </div>
        </Content>
      </Section>
      <Section>
        <Header>Encounter details</Header>
        <HorizontalLine />
        <Content>
          <div>
            <Label>Facility: </Label>
            <Text>{location?.facility?.name || null}</Text>
          </div>
          <div>
            <Label>Department: </Label>
            <Text>{getFullLocationName(location)}</Text>
          </div>
          <div>
            <Label>Supervising clinician: </Label>
            <Text>{examiner?.displayName}</Text>
          </div>
          <div>
            <Label>Date of admission: </Label>
            <Text>
              <DateDisplay date={startDate} showTime />
            </Text>
          </div>
          <div>
            <Label>Discharging physician: </Label>
            <Text>{discharge?.discharger?.displayName}</Text>
          </div>
          <div>
            <Label>Date of discharge: </Label>
            <Text>
              <DateDisplay date={endDate} showTime />
            </Text>
          </div>
          {discharge && dischargeDispositionVisible && (
            <div>
              <Label>Discharge disposition: </Label>
              <Text>{discharge.disposition?.name}</Text>
            </div>
          )}
          <div>
            <Label>Reason for encounter: </Label>
            <Text>{reasonForEncounter}</Text>
          </div>
        </Content>
      </Section>
      <Section>
        <Grid>
          <GridItem>
            <Label>Ongoing conditions</Label>
          </GridItem>
          <GridItem>
            <ListColumn>
              {patientConditions.map(condition => (
                <li>{condition}</li>
              ))}
            </ListColumn>
          </GridItem>
        </Grid>
      </Section>

      <Section>
        <Grid>
          <GridItem>
            <Label>Primary diagnoses</Label>
          </GridItem>
          <GridItem>
            <ListColumn>
              <DiagnosesList diagnoses={primaryDiagnoses} />
            </ListColumn>
          </GridItem>
        </Grid>
      </Section>

      <Section>
        <Grid>
          <GridItem>
            <Label>Secondary diagnoses</Label>
          </GridItem>
          <GridItem>
            <ListColumn>
              <DiagnosesList diagnoses={secondaryDiagnoses} />
            </ListColumn>
          </GridItem>
        </Grid>
      </Section>

      <Section>
        <Grid>
          <GridItem>
            <Label>Procedures</Label>
          </GridItem>
          <GridItem>
            <ListColumn>
              <ProceduresList procedures={procedures} />
            </ListColumn>
          </GridItem>
        </Grid>
      </Section>

      <Section>
        <Grid>
          <GridItem>
            <Label>Medications</Label>
          </GridItem>
          <Box display="flex" flexDirection="column">
            <InnerGrid>
              <GridItem>
                <Text>Current</Text>
              </GridItem>
              <GridItem>
                <ListColumn>
                  <MedicationsList medications={medications.filter(m => !m.discontinued)} />
                </ListColumn>
              </GridItem>
            </InnerGrid>
            <InnerGrid>
              <GridItem>
                <Text>Discontinued</Text>
              </GridItem>
              <GridItem>
                <ListColumn>
                  <MedicationsList medications={medications.filter(m => m.discontinued)} />
                </ListColumn>
              </GridItem>
            </InnerGrid>
          </Box>
        </Grid>
      </Section>

      <Section>
        <Label>Discharge planning notes:</Label>
        <Note>{discharge?.note}</Note>
      </Section>
    </SummaryPageContainer>
  );
});

export const DischargeSummaryView = React.memo(() => {
  const api = useApi();
  const [discharge, setDischarge] = useState(null);
  const { encounter } = useEncounter();
  const { printPage } = useElectron();

  useEffect(() => {
    (async () => {
      if (encounter?.id) {
        const data = await api.get(
          `encounter/${encounter?.id}/discharge`,
          {},
          { isErrorUnknown: isErrorUnknownAllow404s },
        );
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
          onClick={() => printPage()}
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
