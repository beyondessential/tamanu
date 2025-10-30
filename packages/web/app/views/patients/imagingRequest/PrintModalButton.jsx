import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router';
import { useEncounterDataQuery } from '../../../api/queries';
import { Button, Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { MultipleImagingRequestsWrapper } from '../../../components/PatientPrinting/modals/MultipleImagingRequestsPrintoutModal';
import { printPDF } from '../../../components/PatientPrinting/PDFLoader';

const PrintModalInternals = ({ imagingRequest }) => {
  const encounterQuery = useEncounterDataQuery(imagingRequest.encounterId);

  if (encounterQuery.isError) {
    return (
      <div>
        <div>An error occurred</div>
        <pre>{JSON.stringify(encounterQuery.error?.message, null, 2)}</pre>
      </div>
    );
  }

  if (encounterQuery.isFetching) return <LoadingIndicator data-testid="loadingindicator-907d" />;

  return (
    <MultipleImagingRequestsWrapper
      imagingRequests={[imagingRequest]}
      encounter={encounterQuery.data}
      data-testid="multipleimagingrequestswrapper-sx1m"
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
        title={
          <TranslatedText
            stringId="imaging.modal.print.title"
            fallback="Imaging Request"
            data-testid="translatedtext-pw7b"
          />
        }
        open={isModalOpen}
        onClose={closeModal}
        width="md"
        color={Colors.white}
        printable
        onPrint={() => printPDF('imaging-request-printout')}
        data-testid="modal-tdx7"
      >
        <PrintModalInternals {...props} data-testid="printmodalinternals-z572" />
      </Modal>
      <Button
        variant="outlined"
        onClick={openModal}
        style={{ marginLeft: '0.5rem' }}
        data-testid="button-x89u"
      >
        <TranslatedText
          stringId="imaging.action.print"
          fallback="Print request"
          data-testid="translatedtext-6jhk"
        />
      </Button>
    </>
  );
};
