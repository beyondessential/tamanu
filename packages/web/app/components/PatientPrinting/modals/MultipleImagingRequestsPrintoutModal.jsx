import React from 'react';
import { PDFViewer, printPDF } from '../PDFViewer';
import { MultipleImagingRequestsPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { Colors } from '../../../constants';
import { useLocalisation } from '../../../contexts/Localisation';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../Modal';

export const MultipleImagingRequestsWrapper = ({ encounter, imagingRequests }) => {
  const { getLocalisation } = useLocalisation();
  const certificateData = useCertificate();
  const api = useApi();
  const { data: patient, isLoading: isPatientLoading } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}`),
  );
  const { data: additionalData, isLoading: isAdditionalDataLoading } = useQuery(
    ['additionalData', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}/additionalData`),
  );
  const isVillageEnabled = !!patient?.villageId;
  const { data: village = {}, isLoading: isVillageLoading } = useQuery(
    ['village', encounter.patientId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: isVillageEnabled,
    },
  );
  const isLoading =
    isPatientLoading || isAdditionalDataLoading || (isVillageEnabled && isVillageLoading);
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <PDFViewer id="imaging-request-printout">
      <MultipleImagingRequestsPrintout
        getLocalisation={getLocalisation}
        patient={patient}
        encounter={encounter}
        imagingRequests={imagingRequests}
        certificateData={certificateData}
      />
    </PDFViewer>
  );
};
export const MultipleImagingRequestsPrintoutModal = ({
  open,
  onClose,
  encounter,
  imagingRequests,
}) => {
  return (
    <Modal
      title="Print imaging requests"
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
      onPrint={() => printPDF('imaging-request-printout')}
    >
      <MultipleImagingRequestsWrapper encounter={encounter} imagingRequests={imagingRequests} />
    </Modal>
  );
};
