import React, { useState, useEffect } from 'react';

import { HandoverNotesPDF } from 'shared/utils/handoverNotes';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { useCertificate } from '../../utils/useCertificate';
import { PDFViewer, printPDF } from '../PatientPrinting/PDFViewer';

export const HandoverNotesModal = React.memo(({ area, ...props }) => {
  const [handoverNotes, setHandoverNotes] = useState([]);
  const [locationGroup, setLocationGroup] = useState({});
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { logo } = useCertificate();

  useEffect(() => {
    if (area) {
      api.get(`locationGroup/${area}/handoverNotes`).then(response => {
        setHandoverNotes(response.data);
        setLocationGroup(response.locationGroup);
      });
    }
  }, [api, area]);
  return (
    <Modal {...props} onPrint={() => printPDF('handover-notes')}>
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
