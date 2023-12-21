import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HandoverNotesPDF } from '@tamanu/shared/utils/handoverNotes';
import { getDisplayDate } from '@tamanu/shared/utils/patientCertificates/getDisplayDate';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useSettings } from '../../contexts/Settings';
import { useCertificate } from '../../utils/useCertificate';
import { PDFViewer, printPDF } from '../PatientPrinting/PDFViewer';

export const HandoverNotesModal = React.memo(({ area: areaId, ...props }) => {
  const { getSetting } = useSettings();
  const api = useApi();
  const { title, subTitle, logo } = useCertificate();
  const letterheadConfig = { title, subTitle };
  const modalTitle = `Handover notes ${getDisplayDate(new Date(), 'dd/MM/yy')}`;

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
    <Modal {...props} title={modalTitle} onPrint={() => printPDF('handover-notes')}>
      <PDFViewer id="handover-notes" width={800} height={1000} showToolbar={false}>
        <HandoverNotesPDF
          logoSrc={logo}
          handoverNotes={handoverNotes}
          locationGroupName={locationGroup.name}
          getSetting={getSetting}
          letterheadConfig={letterheadConfig}
        />
      </PDFViewer>
    </Modal>
  );
});
