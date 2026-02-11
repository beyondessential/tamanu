import React from 'react';
import { Navigate } from 'react-router';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PrintIcon from '@material-ui/icons/Print';

import { Button, useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { DischargeSummaryPrintout } from '@tamanu/shared/utils/patientCertificates';

import { useEncounter } from '../../contexts/Encounter';
import { useCertificate } from '../../utils/useCertificate';
import { useLocalisation } from '../../contexts/Localisation';
import { useTranslation } from '../../contexts/Translation';
import {
  usePatientAdditionalDataQuery,
  useReferenceDataQuery,
  usePatientConditionsQuery,
} from '../../api/queries';
import { printPDF, PDFLoader } from '../../components/PatientPrinting/PDFLoader';
import { useEncounterDischargeQuery } from '../../api/queries/useEncounterDischargeQuery';
import { useSettings } from '../../contexts/Settings';

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
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();
  const { getLocalisation } = useLocalisation();
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const { globalTimeZone } = useDateTime();
  const { encounter } = useEncounter();
  const patient = useSelector(state => state.patient);
  const { data: additionalData, isFetching: isPADLoading } = usePatientAdditionalDataQuery(
    patient.id,
  );
  const { data: village } = useReferenceDataQuery(patient?.villageId);
  const { data: discharge, isFetching: isDischargeLoading } = useEncounterDischargeQuery(encounter);

  const {
    data: patientConditions,
    isFetching: isLoadingPatientConditions,
  } = usePatientConditionsQuery(patient.id);
  // If there is no encounter loaded then this screen can't be displayed
  if (!encounter?.id) {
    return <Navigate to="/patients/all" replace data-testid="redirect-imzj" />;
  }

  const isLoading =
    isPADLoading || isDischargeLoading || isLoadingPatientConditions || isCertificateFetching;

  return (
    <Container data-testid="container-ogda">
      <NavContainer data-testid="navcontainer-03e6">
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => printPDF('discharge-summary')}
          startIcon={<PrintIcon data-testid="printicon-fci3" />}
          data-testid="button-n2yc"
        >
          Print Summary
        </Button>
      </NavContainer>
      <PDFLoader isLoading={isLoading} id="discharge-summary" data-testid="pdfloader-mj0p">
        <DischargeSummaryPrintout
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          discharge={discharge}
          patientConditions={patientConditions}
          certificateData={certificateData}
          getLocalisation={getLocalisation}
          getTranslation={getTranslation}
          getSetting={getSetting}
          globalTimeZone={globalTimeZone}
          data-testid="dischargesummaryprintout-zgjd"
        />
      </PDFLoader>
    </Container>
  );
});
