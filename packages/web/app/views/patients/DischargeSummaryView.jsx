import React from 'react';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';
import { Button } from '../../components/Button';
import { useEncounter } from '../../contexts/Encounter';
import { Colors } from '../../constants';
import { useCertificate } from '../../utils/useCertificate';
import { useLocalisation } from '../../contexts/Localisation';
import { usePatientAdditionalDataQuery, useReferenceData } from '../../api/queries';
import { DischargeSummaryPrintout } from '@tamanu/shared/utils/patientCertificates';
import { printPDF, PDFViewer } from '../../components/PatientPrinting/PDFViewer';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useEncounterDischarge } from '../../api/queries/useEncounterDischarge';

const Container = styled.div`
  background: ${Colors.white};
  height: calc(100vh - 142px);
`;

const NavContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

export const DischargeSummaryView = React.memo(() => {
  const { getLocalisation } = useLocalisation();
  const { encounter } = useEncounter();
  const { title, subTitle, logo } = useCertificate();

  // If there is no encounter loaded then this screen can't be displayed
  if (!encounter?.id) {
    return <Redirect to="/patients/all" />;
  }

  const patient = useSelector(state => state.patient);
  const { data: additionalData, isLoading: isPADLoading } = usePatientAdditionalDataQuery(
    patient.id,
  );

  const { data: discharge, isLoading: isDischargeLoading } = useEncounterDischarge(encounter);

  if (isPADLoading || isDischargeLoading) return <LoadingIndicator />;

  patient.village = useReferenceData(patient?.villageId)?.data?.name;

  return (
    <Container>
      <NavContainer>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => printPDF('discharge-summary')}
          startIcon={<PrintIcon />}
        >
          Print Summary
        </Button>
      </NavContainer>
      <PDFViewer id="discharge-summary" showToolbar={false}>
        <DischargeSummaryPrintout
          patientData={{ ...patient, additionalData }}
          encounter={encounter}
          discharge={discharge}
          logo={logo}
          title={title}
          subTitle={subTitle}
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Container>
  );
});
