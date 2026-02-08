import React from 'react';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { PDFLoader, printPDF } from '../PDFLoader';
import { MultipleImagingRequestsPrintout } from '@tamanu/shared/utils/patientCertificates';
import { usePatientDataQuery } from '../../../api/queries/usePatientDataQuery';
import { useReferenceDataQuery } from '../../../api/queries/useReferenceDataQuery';
import { Colors } from '../../../constants';
import { useLocalisation } from '../../../contexts/Localisation';
import { useSettings } from '../../../contexts/Settings';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation/TranslatedText';

export const MultipleImagingRequestsWrapper = ({ encounter, imagingRequests }) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const { countryTimeZone } = useDateTimeFormat();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();
  const { data: patient, isLoading: isPatientLoading } = usePatientDataQuery(encounter.patientId);
  const isVillageEnabled = patient?.villageId;
  const { data: village, isLoading: isVillageLoading } = useReferenceDataQuery(patient?.villageId);
  const isLoading =
    isPatientLoading || (isVillageEnabled && isVillageLoading) || isCertificateFetching;
  return (
    <PDFLoader isLoading={isLoading} id="imaging-request-printout" data-testid="pdfloader-fwti">
      <MultipleImagingRequestsPrintout
        getLocalisation={getLocalisation}
        getSetting={getSetting}
        patient={{ ...patient, village }}
        encounter={encounter}
        imagingRequests={imagingRequests}
        certificateData={certificateData}
        countryTimeZone={countryTimeZone}
        data-testid="multipleimagingrequestsprintout-mc0g"
      />
    </PDFLoader>
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
          fallback="Print imaging request/s"
          data-testid="translatedtext-svux"
        />
      }
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
      onPrint={() => printPDF('imaging-request-printout')}
      data-testid="modal-9574"
    >
      <MultipleImagingRequestsWrapper
        encounter={encounter}
        imagingRequests={imagingRequests}
        data-testid="multipleimagingrequestswrapper-igip"
      />
    </Modal>
  );
};
