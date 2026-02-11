import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { useDateTime } from '@tamanu/ui-components';

import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { PrescriptionPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useSettings } from '../../../contexts/Settings';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedText } from '../../Translation/TranslatedText';
import { usePatientAdditionalDataQuery } from '../../../api/queries';

export const MultiplePrescriptionPrintoutModal = ({
  encounter,
  prescriberId,
  prescriptions,
  open,
  onClose,
  patientWeight,
}) => {
  const { getSetting } = useSettings();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();
  const api = useApi();
  const { facilityId } = useAuth();
  const { globalTimeZone } = useDateTime();

  const { data: patient, isLoading: isPatientLoading } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encounter.patientId}`),
  );

  const { data: prescriber, isLoading: isPrescriberLoading } = useQuery(
    ['prescriber', prescriberId],
    () => api.get(`user/${prescriberId}`),
    {
      enabled: !!prescriberId,
    },
  );

  const {
    data: additionalData,
    isLoading: isAdditionalDataLoading,
  } = usePatientAdditionalDataQuery(encounter.patientId);

  const { data: village = {}, isLoading: isVillageLoading } = useQuery(
    ['village', encounter.patientId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: !!patient?.villageId,
    },
  );

  const { data: facility, isLoading: isFacilityLoading } = useQuery(['facility', facilityId], () =>
    api.get(`facility/${encodeURIComponent(facilityId)}`),
  );

  const isLoading =
    isPatientLoading ||
    isAdditionalDataLoading ||
    isPrescriberLoading ||
    (isVillageLoading && !!patient?.villageId) ||
    isFacilityLoading ||
    isCertificateFetching;

  return (
    <Modal
      title={
        <TranslatedText
          stringId="medication.modal.printMultiple.title"
          fallback="Print prescription"
          data-testid="translatedtext-v5oy"
        />
      }
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
      onPrint={() => printPDF('prescription-printout')}
      data-testid="modal-2t67"
    >
      <PDFLoader isLoading={isLoading} id="prescription-printout" data-testid="pdfloader-bblq">
        <PrescriptionPrintout
          certificateData={certificateData}
          patientData={{ ...patient, additionalData, village, patientWeight }}
          prescriber={prescriber}
          prescriptions={prescriptions}
          encounterData={encounter}
          facility={facility}
          getSetting={getSetting}
          globalTimeZone={globalTimeZone}
          data-testid="prescriptionprintout-on8m"
        />
      </PDFLoader>
    </Modal>
  );
};

MultiplePrescriptionPrintoutModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  prescriberId: PropTypes.string.isRequired,
  prescriptions: PropTypes.array.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
