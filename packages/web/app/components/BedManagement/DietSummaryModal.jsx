import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DietSummaryPDF } from '@tamanu/shared/utils/dietSummary';
import { useDateTime } from '@tamanu/ui-components';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useSettings } from '../../contexts/Settings';
import { useCertificate } from '../../utils/useCertificate';
import { TranslatedText } from '../Translation/TranslatedText';
import { PDFLoader, printPDF } from '../PatientPrinting/PDFLoader';
import { useAuth } from '../../contexts/Auth';

export const DietSummaryModal = React.memo(({ area: areaId, ...props }) => {
  const { getSetting } = useSettings();
  const { formatShortest, primaryTimeZone, getCurrentDate } = useDateTime();
  const api = useApi();
  const { facilityId } = useAuth();
  const { data: certificateData, isFetching: isFetchingCertificate } = useCertificate();
  const { logo, title, subTitle } = certificateData;

  const modalTitle = (
    <TranslatedText
      stringId="bedManagement.modal.dietSummary.title"
      fallback="Diet summary sheet :date"
      replacements={{ date: formatShortest(getCurrentDate()) }}
    />
  );

  const { data: dietSummary, isFetching: isFetchingDietSummary } = useQuery(
    ['dietSummary', facilityId, areaId],
    () => api.get('dietSummary', { ...(areaId ? { areaId } : {}) }),
    { enabled: props.open },
  );

  return (
    <Modal {...props} title={modalTitle} onPrint={() => printPDF('diet-summary')}>
      <PDFLoader isLoading={isFetchingCertificate || isFetchingDietSummary} id="diet-summary">
        <DietSummaryPDF
          logoSrc={logo}
          letterheadConfig={{ title, subTitle }}
          columns={dietSummary?.columns}
          hospitalTotals={dietSummary?.hospitalTotals}
          areas={dietSummary?.areas}
          getSetting={getSetting}
          primaryTimeZone={primaryTimeZone}
        />
      </PDFLoader>
    </Modal>
  );
});
