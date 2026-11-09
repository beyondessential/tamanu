import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { ForbiddenError } from '@tamanu/errors';
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
import { ForbiddenErrorModalContents } from '../ForbiddenErrorModal';

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
  const { logo, title, subTitle, printedBy } = certificateData;
  const errorMessageRef = useRef(null);

  const modalTitle = (
    <TranslatedText
      stringId="bedManagement.modal.dietSummary.title"
      fallback="Diet summary sheet :date"
      replacements={{ date: formatShortest(getCurrentDate()) }}
      data-testid="translatedtext-dietsummary-title"
    />
  );

  const {
    data: dietSummary,
    isFetching: isFetchingDietSummary,
    isError: isDietSummaryError,
    error: dietSummaryError,
  } = useQuery(
    ['dietSummary', facilityId, areaId],
    () => api.get('dietSummary', { ...(areaId ? { areaId } : {}) }),
    { enabled: props.open },
  );

  const isLoading = isFetchingCertificate || isFetchingDietSummary;
  const isForbidden = dietSummaryError instanceof ForbiddenError;

  // Move focus to the error so a screen-reader user tabbed onto the (now-removed) Print
  // button isn't dropped silently onto the document body.
  useEffect(() => {
    if (isDietSummaryError && !isForbidden) {
      errorMessageRef.current?.focus();
    }
  }, [isDietSummaryError, isForbidden]);

  return (
    <Modal
      {...props}
      title={modalTitle}
      printable={!isDietSummaryError && !isLoading}
      onPrint={() => printPDF('diet-summary')}
      data-testid="modal-dietsummary"
    >
      {isDietSummaryError ? (
        isForbidden ? (
          <ForbiddenErrorModalContents
            onClose={props.onClose}
            data-testid="forbiddenerrormodalcontents-dietsummary"
          />
        ) : (
          <ErrorMessage
            ref={errorMessageRef}
            tabIndex={-1}
            role="alert"
            data-testid="errormessage-dietsummary"
          >
            <TranslatedText
              stringId="bedManagement.modal.dietSummary.error"
              fallback="Something went wrong loading the diet summary. Please try again."
              data-testid="translatedtext-dietsummary-error"
            />
          </ErrorMessage>
        )
      ) : (
        <PDFLoader
          isLoading={isLoading}
          id="diet-summary"
          data-testid="pdfloader-dietsummary"
        >
          <DietSummaryPDF
            logoSrc={logo}
            letterheadConfig={{ title, subTitle }}
            columns={dietSummary?.columns}
            hospitalTotals={dietSummary?.hospitalTotals}
            areas={dietSummary?.areas}
            getSetting={getSetting}
            translations={translations}
            primaryTimeZone={primaryTimeZone}
            printedBy={printedBy}
            data-testid="dietsummarypdf"
          />
        </PDFLoader>
      )}
    </Modal>
  );
});
