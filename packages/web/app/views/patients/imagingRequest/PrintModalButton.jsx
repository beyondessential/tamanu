import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEncounterData } from '../../../api/queries';
import { Button } from '../../../components/Button';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { Modal } from '../../../components/Modal';
import { MultipleImagingRequestsWrapper } from '../../../components/PatientPrinting/modals/MultipleImagingRequestsPrintoutModal';
import { Colors } from '../../../constants';

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
    <MultipleImagingRequestsWrapper
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
