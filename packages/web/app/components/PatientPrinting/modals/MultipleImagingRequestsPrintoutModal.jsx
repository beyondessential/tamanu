import React from 'react';
import { PDFViewer, printPDF } from '../PDFViewer';
import { MultipleImagingRequestsPrintout } from '@tamanu/shared/utils/patientCertificates';
import { usePatientData } from '../../../api/queries/usePatientData';
import { useReferenceData } from '../../../api/queries/useReferenceData';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { Colors } from '../../../constants';
import { useLocalisation } from '../../../contexts/Localisation';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation/TranslatedText';

export const MultipleImagingRequestsWrapper = ({ encounter, imagingRequests }) => {
  const { getLocalisation } = useLocalisation();
  const certificateData = useCertificate();
  const { data: patient, isLoading: isPatientLoading } = usePatientData(encounter.patientId);
  const isVillageEnabled = patient?.villageId;
  const { data: village, isLoading: isVillageLoading } = useReferenceData(patient?.villageId);
  const isLoading = isPatientLoading || (isVillageEnabled && isVillageLoading);

  if (isLoading || !certificateData.logo) {
    return <LoadingIndicator />;
  }

  return (
    <PDFViewer id="imaging-request-printout">
      <MultipleImagingRequestsPrintout
        getLocalisation={getLocalisation}
        patient={{ ...patient, village }}
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
      title={
        <TranslatedText
          stringId="imaging.modal.printMultiple.title"
          fallback="Print imaging requests"
        />
      }
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
