import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HandoverNotesPDF } from '@tamanu/shared/utils/handoverNotes';
import { getDisplayDate } from '@tamanu/shared/utils/patientCertificates/getDisplayDate';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { useCertificate } from '../../utils/useCertificate';
import { PDFViewer, printPDF } from '../PatientPrinting/PDFViewer';

export const HandoverNotesModal = React.memo(({ area: areaId, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { data: certificateData, isFetching: isFetchingCertificate } = useCertificate();
  const { logo, title, subTitle } = certificateData;
  const letterheadConfig = { title, subTitle };
  const modalTitle = `Handover notes ${getDisplayDate(new Date(), 'dd/MM/yy')}`;

  const {
    data: { data: handoverNotes = [], locationGroup = {} } = {},
    refetch: refetchHandoverNotes,
    isFetching: isFetchingHandoverNotes,
  } = useQuery(
    ['locationGroupHandoverNotes'],
    () => areaId && api.get(`locationGroup/${areaId}/handoverNotes`),
  );

  useEffect(() => {
    if (areaId) {
      refetchHandoverNotes();
    }
  }, [refetchHandoverNotes, areaId]);

  if (isFetchingCertificate || isFetchingHandoverNotes) return null;

  return (
    <Modal {...props} title={modalTitle} onPrint={() => printPDF('handover-notes')}>
      <PDFViewer id="handover-notes" width={800} height={1000} showToolbar={false}>
        <HandoverNotesPDF
          logoSrc={logo}
          handoverNotes={handoverNotes}
          locationGroupName={locationGroup.name}
          getLocalisation={getLocalisation}
          letterheadConfig={letterheadConfig}
        />
      </PDFViewer>
    </Modal>
  );
});
