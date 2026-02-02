import React, { useCallback } from 'react';

import { ASSET_NAMES, ICAO_DOCUMENT_TYPES } from '@tamanu/constants';
import { CovidVaccineCertificate } from '@tamanu/shared/utils/patientCertificates';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '@tamanu/ui-components';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { useLocalisation } from '../../../contexts/Localisation';
import { useSettings } from '../../../contexts/Settings';
import { useAdministeredVaccinesQuery, usePatientAdditionalDataQuery } from '../../../api/queries';
import { TranslatedText } from '../../Translation/TranslatedText';

import { PDFLoader, printPDF } from '../PDFLoader';
import { generateUVCI } from '@tamanu/shared/utils/uvci';

export const CovidVaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { localisation, getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const { countryTimeZone } = useDateTimeFormat();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate({
    footerAssetName: ASSET_NAMES.COVID_VACCINATION_CERTIFICATE_FOOTER,
  });
  const { watermark, logo, footerImg, printedBy } = certificateData;
  const { data: additionalData } = usePatientAdditionalDataQuery(patient.id);
  const uvciFormat = getLocalisation('previewUvciFormat');
  const countryCode = getLocalisation('country.alpha-2');

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
  const requireSigning = getSetting(
    'features.covidCertificates.enableCovidVaccinationCertificateSigning',
  );

  const createCovidVaccineCertificateNotification = useCallback(
    data =>
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON,
        requireSigning,
        patientId: patient.id,
        forwardAddress: data.email,
        createdBy: printedBy,
        printedDate: getCurrentDateString(),
      }),
    [api, patient.id, printedBy, requireSigning],
  );

  const patientData = { ...patient, additionalData };

  const isLoading = isVaccineFetching || isCertificateFetching;

  let uvci;
  if (requireSigning && vaccinations.length) {
    const mostRecentVaccination = vaccinations.filter(date => date).reverse()[0];
    uvci = generateUVCI(mostRecentVaccination.id, { format: uvciFormat, countryCode });
  }

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
          signingSrc={requireSigning ? footerImg : null}
          printedBy={printedBy}
          printedDate={getCurrentDateString()}
          localisation={localisation}
          getSetting={getSetting}
          countryTimeZone={countryTimeZone}
          data-testid="covidvaccinecertificate-s2dc"
          uvci={uvci}
        />
      </PDFLoader>
    </Modal>
  );
});
