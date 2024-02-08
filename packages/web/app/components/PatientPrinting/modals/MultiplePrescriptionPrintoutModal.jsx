import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../../Modal';
import { LoadingIndicator } from '../../LoadingIndicator';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { PrescriptionPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useLocalisation } from '../../../contexts/Localisation';
import { PDFViewer, printPDF } from '../PDFViewer';
import { useAuth } from '../../../contexts/Auth';

export const MultiplePrescriptionPrintoutModal = ({
  encounter,
  prescriberId,
  prescriptions,
  open,
  onClose,
}) => {
  const { getLocalisation } = useLocalisation();
  const { data: certificateData, isFetching: isFetchingCertificate } = useCertificate();
  const api = useApi();
  const { facility } = useAuth();

  const { data: patient, isLoading: isLoadingPatient } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encounter.patientId}`),
  );

  const { data: prescriber, isLoading: isLoadingPrescriber } = useQuery(
    ['prescriber', prescriberId],
    () => api.get(`user/${prescriberId}`),
    {
      enabled: !!prescriberId,
    },
  );

  const { data: additionalData, isLoading: isLoadingAdditionalData } = useQuery(
    ['additionalData', encounter.patientId],
    () => api.get(`patient/${encounter.patientId}/additionalData`),
  );

  const { data: village = {}, isLoading: isLoadingVillage } = useQuery(
    ['village', encounter.patientId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: !!patient?.villageId,
    },
  );

  const isVillageLoading = isLoadingVillage && !!patient?.villageId;
  const isLoading =
    isLoadingPatient ||
    isLoadingAdditionalData ||
    isVillageLoading ||
    isFetchingCertificate ||
    isLoadingPrescriber;

  return (
    <Modal
      title="Print prescriptions"
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
      onPrint={() => printPDF('prescription-printout')}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <PDFViewer id="prescription-printout">
          <PrescriptionPrintout
            certificateData={certificateData}
            patientData={{ ...patient, additionalData, village }}
            prescriber={prescriber}
            prescriptions={prescriptions}
            encounterData={encounter}
            facility={facility}
            getLocalisation={getLocalisation}
          />
        </PDFViewer>
      )}
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
