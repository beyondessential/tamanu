import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HandoverNotesPDF } from 'shared/utils/handoverNotes';
import { getDisplayDate } from 'shared/utils/patientCertificates/getDisplayDate';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { useCertificate } from '../../utils/useCertificate';
import { PDFViewer, printPDF } from '../PatientPrinting/PDFViewer';

export const HandoverNotesModal = React.memo(({ area: areaId, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { logo } = useCertificate();
  const title = `Handover notes ${getDisplayDate(new Date(), 'dd/MM/yy')}`;

  const {
    data: { data: handoverNotes = [], locationGroup = {} } = {},
    refetch: refetchHandoverNotes,
  } = useQuery(
    ['locationGroupHandoverNotes'],
    () => areaId && api.get(`locationGroup/${areaId}/handoverNotes`),
  );

  useEffect(() => {
    if (areaId) {
      refetchHandoverNotes();
    }
  }, [refetchHandoverNotes, areaId]);

  return (
    <Modal {...props} title={title} onPrint={() => printPDF('handover-notes')}>
      <PDFViewer id="handover-notes" width={800} height={1000} showToolbar={false}>
        <HandoverNotesPDF
          logoSrc={logo}
          handoverNotes={handoverNotes}
          locationGroupName={locationGroup.name}
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Modal>
  );
});
