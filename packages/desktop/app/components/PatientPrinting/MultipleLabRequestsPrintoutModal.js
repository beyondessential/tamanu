import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../Modal';
import { MultipleLabRequestsPrintout } from './MultipleLabRequestsPrintout';
import { LoadingIndicator } from '../LoadingIndicator';
import { useCertificate } from '../../utils/useCertificate';
import { useApi } from '../../api';
import { Colors } from '../../constants';

export const MultipleLabRequestsPrintoutModal = ({ encounter, labRequests, open, onClose }) => {
  const certificateData = useCertificate();
  const api = useApi();

  const { data: patient, isLoading: patientLoading } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}`),
  );

  const { data: additionalData, isLoading: additionalDataLoading } = useQuery(
    ['additionalData', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}/additionalData`),
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
      title="Print lab requests"
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
    >
      {patientLoading || additionalDataLoading || villageLoading ? (
        <LoadingIndicator />
      ) : (
        <MultipleLabRequestsPrintout
          certificateData={certificateData}
          patientData={{ ...patient, additionalData, village }}
          encounterData={encounter}
          labRequests={labRequests}
        />
      )}
    </Modal>
  );
};

MultipleLabRequestsPrintoutModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
