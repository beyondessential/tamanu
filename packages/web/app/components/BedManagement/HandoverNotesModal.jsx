import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HandoverNotesPDF } from '@tamanu/shared/utils/handoverNotes';
import { useDateTime } from '@tamanu/ui-components';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { useSettings } from '../../contexts/Settings';
import { useCertificate } from '../../utils/useCertificate';
import { TranslatedText } from '../Translation/TranslatedText';
import { PDFLoader, printPDF } from '../PatientPrinting/PDFLoader';
import { useAuth } from '../../contexts/Auth';

export const HandoverNotesModal = React.memo(({ area: areaId, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const { formatShortest, primaryTimeZone } = useDateTime();
  const api = useApi();
  const { facilityId } = useAuth();
  const { data: certificateData, isFetching: isFetchingCertificate } = useCertificate();
  const { logo, title, subTitle } = certificateData;
  const letterheadConfig = { title, subTitle };
  const modalTitle = (
    <TranslatedText
      stringId="bedManagement.modal.handoverNotes.title"
      fallback="Handover notes :date"
      replacements={{ date: formatShortest(new Date()) }}
      data-testid="translatedtext-4lua"
    />
  );

  const {
    data: { data: handoverNotes = [], locationGroup = {} } = {},
    refetch: refetchHandoverNotes,
    isFetching: isFetchingHandoverNotes,
  } = useQuery(
    ['locationGroupHandoverNotes', facilityId],
    () => areaId && api.get(`locationGroup/${areaId}/handoverNotes`, { facilityId }),
    { enabled: !!areaId },
  );

  useEffect(() => {
    if (areaId) {
      refetchHandoverNotes();
    }
  }, [refetchHandoverNotes, areaId]);

  const isLoading = isFetchingCertificate || isFetchingHandoverNotes;

  return (
    <Modal
      {...props}
      title={modalTitle}
      onPrint={() => printPDF('handover-notes')}
      data-testid="modal-8os6"
    >
      <PDFLoader isLoading={isLoading} id="handover-notes" data-testid="pdfloader-fbu0">
        <HandoverNotesPDF
          logoSrc={logo}
          handoverNotes={handoverNotes}
          locationGroupName={locationGroup.name}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
          letterheadConfig={letterheadConfig}
          primaryTimeZone={primaryTimeZone}
          data-testid="handovernotespdf-uu0b"
        />
      </PDFLoader>
    </Modal>
  );
});
