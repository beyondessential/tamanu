import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';
import Box from '@material-ui/core/Box';

import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from '@tamanu/shared/constants';

import { PrintPortal, PrintLetterhead } from '../../components/PatientPrinting';
import { useApi, isErrorUnknownAllow404s } from '../../api';
import { Button } from '../../components/Button';
import { formatShort, getDateDisplay } from '../../components/DateDisplay';
import { useEncounter } from '../../contexts/Encounter';
import { useElectron } from '../../contexts/Electron';
import { Colors } from '../../constants';
import { useCertificate } from '../../utils/useCertificate';
import { getDepartmentName } from '../../utils/department';
import { getDisplayAge } from '../../utils/dateTime';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { useLocalisation } from '../../contexts/Localisation';
import {
  usePatientAdditionalData,
  usePatientConditions,
  useReferenceData,
} from '../../api/queries';
import {
  DisplayValue,
  LocalisedDisplayValue,
} from '../../components/PatientPrinting/printouts/reusable/CertificateLabels';

const Container = styled.div`
  background: ${Colors.white};
  height: 100%;
`;

const SummaryPageContainer = styled.div`
  margin: 0 60px;
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
  font-size: 10px;
  border: 1px solid black;
  white-space: pre-line;
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
  grid-template-columns: max-content auto;
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
  const displayIcd10Codes = getLocalisation('features.displayIcd10CodesInDischargeSummary');

  return diagnoses.map(item => (
    <li>
      {item.diagnosis.name}
      {displayIcd10Codes && <span>{` (${item.diagnosis.code})`}</span>}
    </li>
  ));
};

const ProceduresList = ({ procedures }) => {
  const { getLocalisation } = useLocalisation();
  const displayProcedureCodes = getLocalisation('features.displayProcedureCodesInDischargeSummary');

  return procedures.map(procedure => (
    <li>
      {procedure.procedureType.name}
      {displayProcedureCodes && <span>{` (${procedure.procedureType.code})`}</span>}
    </li>
  ));
};

const MedicationsList = ({ medications, discontinued }) => {
  if (!medications || medications.length === 0) {
    return <span>N/A</span>;
  }

  return medications.map(({ medication, discontinuingReason }) => {
    const prescriptionText = discontinuingReason && discontinued ? `(${discontinuingReason})` : '';
    return (
      <li>
        <span>{`${medication.name} ${prescriptionText}`}</span>
      </li>
    );
  });
};

const SummaryPage = React.memo(({ encounter, discharge }) => {
  const { title, subTitle, logo } = useCertificate();

  const { getLocalisation } = useLocalisation();
  const dischargeDispositionVisible =
    getLocalisation('fields.dischargeDisposition.hidden') === false;

  const patient = useSelector(state => state.patient);
  const { data: village } = useReferenceData(patient.villageId);
  const { data: patientAdditionalData, isLoading: isPADLoading } = usePatientAdditionalData(
    patient.id,
  );
  const { data: patientConditionsData } = usePatientConditions(patient.id);
  const patientConditions = (patientConditionsData?.data || [])
    .filter(p => !p.resolved)
    .map(p => p.condition.name)
    .sort((a, b) => a.localeCompare(b));

  let address = 'N/A';
  if (!isPADLoading) {
    const { streetVillage, cityTown, country } = patientAdditionalData;

    if (streetVillage && cityTown && country) {
      address = `${streetVillage}, ${cityTown}, ${country.name}`;
    }
  }

  const {
    diagnoses,
    procedures,
    medications,
    startDate,
    endDate,
    location,
    examiner,
    reasonForEncounter = 'N/A',
  } = encounter;

  const visibleDiagnoses = diagnoses.filter(
    ({ certainty }) => !DIAGNOSIS_CERTAINTIES_TO_HIDE.includes(certainty),
  );
  const primaryDiagnoses = visibleDiagnoses.filter(d => d.isPrimary);
  const secondaryDiagnoses = visibleDiagnoses.filter(d => !d.isPrimary);

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
          <DisplayValue name="Patient name">
            {patient.firstName} {patient.lastName}
          </DisplayValue>
          <LocalisedDisplayValue path="fields.displayId.shortLabel">
            {patient.displayId}
          </LocalisedDisplayValue>
          <DisplayValue name="DOB">
            {`${formatShort(patient.dateOfBirth)} (${getDisplayAge(patient.dateOfBirth)})`}
          </DisplayValue>
          <DisplayValue name="Address">{`${address}`} </DisplayValue>
          <DisplayValue name="Sex">{`${capitaliseFirstLetter(patient.sex)}`} </DisplayValue>
          <DisplayValue name="Village">{`${village?.name || 'N/A'}`} </DisplayValue>
        </Content>
      </Section>

      <Section>
        <Header>Encounter details</Header>
        <HorizontalLine />
        <Content>
          <DisplayValue name="Facility">{location?.facility?.name || 'N/A'} </DisplayValue>
          <DisplayValue name="Department">{getDepartmentName(encounter)} </DisplayValue>
          <DisplayValue name="Supervising clinician">{examiner?.displayName} </DisplayValue>
          <DisplayValue name="Date of admission">
            {getDateDisplay(startDate, { showTime: false })}
          </DisplayValue>
          <DisplayValue name="Discharging physician">
            {discharge?.discharger?.displayName}
          </DisplayValue>
          <DisplayValue name="Date of discharge">
            {getDateDisplay(endDate, { showTime: false })}
          </DisplayValue>
          {discharge && dischargeDispositionVisible && (
            <DisplayValue name="Discharge disposition">{discharge.disposition?.name}</DisplayValue>
          )}
          <DisplayValue name="Reason for encounter">{reasonForEncounter}</DisplayValue>
        </Content>
      </Section>

      {patientConditions.length > 0 && (
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
      )}

      {primaryDiagnoses.length > 0 && (
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
      )}

      {secondaryDiagnoses.length > 0 && (
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
      )}

      {procedures.length > 0 && (
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
      )}

      {medications.length !== 0 && (
        <Section>
          <Grid>
            <GridItem>
              <Label>Medications</Label>
            </GridItem>
            <InnerGrid>
              <GridItem>
                <Text>Current</Text>
              </GridItem>
              <GridItem>
                <ListColumn>
                  <MedicationsList medications={medications.filter(m => !m.discontinued)} />
                </ListColumn>
              </GridItem>
              <GridItem>
                <Text>Discontinued</Text>
              </GridItem>
              <GridItem>
                <ListColumn>
                  <MedicationsList
                    medications={medications.filter(m => m.discontinued)}
                    discontinued
                  />
                </ListColumn>
              </GridItem>
            </InnerGrid>
          </Grid>
        </Section>
      )}

      {discharge?.note && (
        <Section>
          <Label>Discharge planning notes:</Label>
          <Note>{discharge.note}</Note>
        </Section>
      )}
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
