import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { PrescriptionPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useLocalisation } from '../../../contexts/Localisation';
import { useSettings } from '../../../contexts/Settings';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedText } from '../../Translation/TranslatedText';

export const MultiplePrescriptionPrintoutModal = ({
  encounter,
  prescriberId,
  prescriptions,
  open,
  onClose,
  patientWeight,
}) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();
  const api = useApi();
  const { facilityId } = useAuth();

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

  const { data: additionalData, isLoading: isAdditionalDataLoading } = useQuery(
    ['additionalData', encounter.patientId],
    () => api.get(`patient/${encounter.patientId}/additionalData`),
  );

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
          fallback="Print prescriptions"
        />
      }
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
      onPrint={() => printPDF('prescription-printout')}
    >
      <PDFLoader isLoading={isLoading} id="prescription-printout">
        <PrescriptionPrintout
          certificateData={certificateData}
          patientData={{ ...patient, additionalData, village, patientWeight }}
          prescriber={prescriber}
          prescriptions={prescriptions}
          encounterData={encounter}
          facility={facility}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
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
