import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Colors } from '../../../constants';
import { Button } from '../../../components/Button';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { Modal } from '../../../components/Modal';
import { useEncounterData } from '../../../api/queries';
import { MultipleImagingRequestsPrintout } from '../../../components/PatientPrinting';

const PrintModalInternals = ({ imagingRequest }) => {
  const encounterQuery = useEncounterData(imagingRequest.encounterId);

  if (encounterQuery.isError) {
    return (
      <div>
        <div>An error occurred</div>
        <pre>{JSON.stringify(encounterQuery.error?.message, null, 2)}</pre>
      </div>
    );
  }

  if (encounterQuery.isFetching) return <LoadingIndicator />;

  return (
    <MultipleImagingRequestsPrintout
      imagingRequests={[imagingRequest]}
      encounter={encounterQuery.data}
    />
  );
};

export const PrintModalButton = props => {
  const { modal } = useParams();
  const [isModalOpen, setModalOpen] = useState(modal === 'print');
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <Modal
        title="Imaging Request"
        open={isModalOpen}
        onClose={closeModal}
        width="md"
        color={Colors.white}
        printable
      >
        <PrintModalInternals {...props} />
      </Modal>
      <Button variant="outlined" onClick={openModal} style={{ marginLeft: '0.5rem' }}>
        Print request
      </Button>
    </>
  );
};
