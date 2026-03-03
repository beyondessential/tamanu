import React, { useCallback } from 'react';

import { ASSET_NAMES, ICAO_DOCUMENT_TYPES } from '@tamanu/constants';
import { CovidVaccineCertificate } from '@tamanu/shared/utils/patientCertificates';
import { getCurrentDateString } from '@tamanu/utils/dateTime';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { useLocalisation } from '../../../contexts/Localisation';
import { useSettings } from '../../../contexts/Settings';
import { useAdministeredVaccinesQuery, usePatientAdditionalDataQuery } from '../../../api/queries';
import { TranslatedText } from '../../Translation/TranslatedText';

import { PDFLoader, printPDF } from '../PDFLoader';

export const CovidVaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate({
    footerAssetName: ASSET_NAMES.COVID_VACCINATION_CERTIFICATE_FOOTER,
  });
  const { watermark, logo, footerImg, printedBy } = certificateData;
  const { data: additionalData } = usePatientAdditionalDataQuery(patient.id);

  const { data: vaccineData, isFetching: isVaccineFetching } = useAdministeredVaccinesQuery(
    patient.id,
    {
      orderBy: 'date',
      order: 'ASC',
      invertNullDateOrdering: true,
      includeNotGiven: false,
    },
  );
  const vaccinations = vaccineData?.data.filter(vaccine => vaccine.certifiable) || [];

  const createCovidVaccineCertificateNotification = useCallback(
    data =>
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON,

        patientId: patient.id,
        forwardAddress: data.email,
        createdBy: printedBy,
        printedDate: getCurrentDateString(),
      }),
    [api, patient.id, printedBy],
  );

  const patientData = { ...patient, additionalData };

  const isLoading = isVaccineFetching || isCertificateFetching;

  return (
    <Modal
      title={
        <TranslatedText
          stringId="vaccine.certificate.covid19.title"
          fallback="COVID-19 Vaccine Certificate"
          data-testid="translatedtext-covid-certificate-title"
        />
      }
      open={open}
      onClose={onClose}
      width="md"
      printable
      onPrint={() => printPDF('covid-vaccine-certificate')}
      additionalActions={
        <EmailButton
          onEmail={createCovidVaccineCertificateNotification}
          data-testid="emailbutton-g2xn"
        />
      }
      data-testid="modal-twv1"
    >
      <PDFLoader isLoading={isLoading} id="covid-vaccine-certificate" data-testid="pdfloader-fwkb">
        <CovidVaccineCertificate
          patient={patientData}
          vaccinations={vaccinations}
          watermarkSrc={watermark}
          logoSrc={logo}
          signingSrc={footerImg}
          printedBy={printedBy}
          printedDate={getCurrentDateString()}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
          data-testid="covidvaccinecertificate-s2dc"
        />
      </PDFLoader>
    </Modal>
  );
});
