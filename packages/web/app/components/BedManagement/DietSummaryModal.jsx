import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { DietSummaryPDF } from '@tamanu/shared/utils/dietSummary';
import { useDateTime } from '@tamanu/ui-components';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useSettings } from '../../contexts/Settings';
import { useTranslation } from '../../contexts/Translation';
import { useCertificate } from '../../utils/useCertificate';
import { TranslatedText } from '../Translation/TranslatedText';
import { PDFLoader, printPDF } from '../PatientPrinting/PDFLoader';
import { useAuth } from '../../contexts/Auth';

const ErrorMessage = styled.p`
  margin: 60px 20px;
`;

export const DietSummaryModal = React.memo(({ area: areaId, ...props }) => {
  const { getSetting } = useSettings();
  const { translations } = useTranslation();
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

  const {
    data: dietSummary,
    isFetching: isFetchingDietSummary,
    isError: isDietSummaryError,
  } = useQuery(
    ['dietSummary', facilityId, areaId],
    () => api.get('dietSummary', { ...(areaId ? { areaId } : {}) }),
    { enabled: props.open },
  );

  return (
    <Modal
      {...props}
      title={modalTitle}
      printable={props.printable && !isDietSummaryError}
      onPrint={() => printPDF('diet-summary')}
    >
      {isDietSummaryError ? (
        <ErrorMessage>
          <TranslatedText
            stringId="bedManagement.modal.dietSummary.error"
            fallback="Something went wrong loading the diet summary. Please try again."
          />
        </ErrorMessage>
      ) : (
        <PDFLoader isLoading={isFetchingCertificate || isFetchingDietSummary} id="diet-summary">
          <DietSummaryPDF
            logoSrc={logo}
            letterheadConfig={{ title, subTitle }}
            columns={dietSummary?.columns}
            hospitalTotals={dietSummary?.hospitalTotals}
            areas={dietSummary?.areas}
            getSetting={getSetting}
            translations={translations}
            primaryTimeZone={primaryTimeZone}
          />
        </PDFLoader>
      )}
    </Modal>
  );
});
