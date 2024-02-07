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
import {
  usePatientAdditionalDataQuery,
  useReferenceData,
  usePatientConditions,
} from '../../api/queries';
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
  const certificateData = useCertificate();
  const { getLocalisation } = useLocalisation();
  const { encounter } = useEncounter();
  const patient = useSelector(state => state.patient);
  const { data: additionalData, isFetching: isPADLoading } = usePatientAdditionalDataQuery(
    patient.id,
  );
  const { data: village } = useReferenceData(patient?.villageId);
  const { data: discharge, isFetching: isDischargeLoading } = useEncounterDischarge(encounter);

  const { data: patientConditions, isFetching: isLoadingPatientConditions } = usePatientConditions(
    patient.id,
  );
  // If there is no encounter loaded then this screen can't be displayed
  if (!encounter?.id) {
    return <Redirect to="/patients/all" />;
  }

  if (isPADLoading || isDischargeLoading || isLoadingPatientConditions) return <LoadingIndicator />;

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
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          discharge={discharge}
          patientConditions={patientConditions}
          certificateData={certificateData}
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Container>
  );
});
