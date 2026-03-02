import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ASSET_NAMES, VACCINATION_CERTIFICATE } from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/utils/dateTime';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { useLocalisation } from '../../../contexts/Localisation';
import { useSettings } from '../../../contexts/Settings';
import {
  usePatientAdditionalDataQuery,
  useAdministeredVaccinesQuery,
  useReferenceDataQuery,
} from '../../../api/queries';
import { TranslatedText } from '../../Translation/TranslatedText';

import { printPDF } from '../PDFLoader';
import { useAuth } from '../../../contexts/Auth';
import { useTranslation } from '../../../contexts/Translation';
import { WorkerRenderedPDFViewer } from '../WorkerRenderedPDFViewer';
import { LoadingIndicator } from '../../LoadingIndicator';

const VACCINE_CERTIFICATE_PDF_ID = 'vaccine-certificate';

export const VaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { localisation } = useLocalisation();
  const { translations } = useTranslation();
  const { getSetting, settings } = useSettings();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate({
    footerAssetName: ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER,
  });
  const { logo, watermark, footerImg, printedBy } = certificateData;
  const {
    data: additionalData,
    isFetching: isAdditionalDataFetching,
  } = usePatientAdditionalDataQuery(patient.id);

  const { title, subTitle } = getSetting('templates.letterhead');
  const { healthFacility } = getSetting('templates.vaccineCertificate');

  const { data: vaccineData, isFetching: isVaccineFetching } = useAdministeredVaccinesQuery(
    patient.id,
    {
      orderBy: 'date',
      order: 'ASC',
      invertNullDateOrdering: true,
      includeNotGiven: false,
    },
  );
  const vaccinations =
    vaccineData?.data.filter(vaccine => !vaccine.scheduledVaccine.hideFromCertificate) || [];

  const { data: facility, isLoading: isFacilityLoading } = useQuery(['facility', facilityId], () =>
    api.get(`facility/${encodeURIComponent(facilityId)}`),
  );

  const createVaccineCertificateNotification = useCallback(
    data =>
      api.post('certificateNotification', {
        type: VACCINATION_CERTIFICATE,
        patientId: patient.id,
        forwardAddress: data.email,
        facilityName: facility.name,
        createdBy: printedBy,
        createdAt: getCurrentDateString(),
      }),
    [api, patient.id, printedBy, facility?.name],
  );

  const { data: village, isFetching: isVillageFetching } = useReferenceDataQuery(patient.villageId);
  const patientData = { ...patient, village, additionalData };

  const isLoading =
    isVaccineFetching ||
    isAdditionalDataFetching ||
    isVillageFetching ||
    isFacilityLoading ||
    isCertificateFetching;

  return (
    <Modal
      title={
        <TranslatedText
          stringId="vaccine.modal.certificate.title"
          fallback="Immunisation Certificate"
          data-testid="translatedtext-immunisation-certificate-title"
        />
      }
      open={open}
      onClose={onClose}
      width="md"
      printable
      onPrint={() => printPDF(VACCINE_CERTIFICATE_PDF_ID)}
      additionalActions={
        <EmailButton
          onEmail={createVaccineCertificateNotification}
          data-testid="emailbutton-f55q"
        />
      }
      data-testid="modal-377p"
    >
      {isLoading ? (
        <LoadingIndicator height="500px" data-testid="loadingindicator-skvx" />
      ) : (
        <WorkerRenderedPDFViewer
          id={VACCINE_CERTIFICATE_PDF_ID}
          queryDeps={[patient.id]}
          vaccinations={vaccinations}
          patient={patientData}
          watermarkSrc={watermark}
          logoSrc={logo}
          facilityName={facility?.name}
          signingSrc={footerImg}
          printedBy={printedBy}
          printedDate={getCurrentDateString()}
          localisation={localisation}
          settings={settings}
          translations={translations}
          certificateData={{ title, subTitle }}
          healthFacility={healthFacility}
          data-testid="workerrenderedpdfviewer-e076"
        />
      )}
    </Modal>
  );
});
