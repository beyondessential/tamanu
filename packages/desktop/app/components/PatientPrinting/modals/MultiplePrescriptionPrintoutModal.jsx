import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import React from 'react';

import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { useCertificate } from '../../../utils/useCertificate';
import { LoadingIndicator } from '../../LoadingIndicator';
import { Modal } from '../../Modal';

import { MultiplePrescriptionPrintout } from '../printouts/MultiplePrescriptionPrintout';

export const MultiplePrescriptionPrintoutModal = ({
  encounter,
  prescriberId,
  prescriptions,
  open,
  onClose,
}) => {
  const certificateData = useCertificate();
  const api = useApi();

  const { data: patient, isLoading: patientLoading } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encounter.patientId}`),
  );

  const { data: prescriber, isLoading: prescriberLoading } = useQuery(
    ['prescriber', prescriberId],
    () => api.get(`user/${prescriberId}`),
    {
      enabled: !!prescriberId,
    },
  );

  const { data: additionalData, isLoading: additionalDataLoading } = useQuery(
    ['additionalData', encounter.patientId],
    () => api.get(`patient/${encounter.patientId}/additionalData`),
  );

  const { data: village = {}, isLoading: villageQueryLoading } = useQuery(
    ['village', encounter.patientId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: !!patient?.villageId,
    },
  );

  const villageLoading = villageQueryLoading && !!patient?.villageId;

  return (
    <Modal
      title="Print prescriptions"
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
    >
      {patientLoading || additionalDataLoading || villageLoading || prescriberLoading ?
        <LoadingIndicator /> :
        (
          <MultiplePrescriptionPrintout
            certificateData={certificateData}
            patientData={{ ...patient, additionalData, village }}
            prescriber={prescriber}
            prescriptions={prescriptions}
          />
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
