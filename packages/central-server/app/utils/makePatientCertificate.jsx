import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import QRCode from 'qrcode';
import { get } from 'lodash';
import config from 'config';
import { ASSET_FALLBACK_NAMES, ASSET_NAMES } from '@tamanu/constants';

import {
  CovidVaccineCertificate,
  getPatientSurveyResponseAnswer,
  tmpdir,
  VaccineCertificate,
} from '@tamanu/shared/utils';
import { CertificateTypes, CovidLabCertificate } from '@tamanu/shared/utils/patientCertificates';

import { getLocalisation } from '../localisation';

async function getCertificateAssets(models, footerAssetName) {
  const footerAsset = await models.Asset.findOne({ raw: true, where: { name: footerAssetName } });
  const footerAssetData = footerAsset?.data;
  const [logo, watermark, signingImage] = (
    await Promise.all(
      [
        ASSET_NAMES.LETTERHEAD_LOGO,
        ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK,
        ...(footerAsset?.data
          ? []
          : [ASSET_FALLBACK_NAMES[footerAssetName] || ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG]),
      ].map(name => name && models.Asset.findOne({ raw: true, where: { name } })),
    )
  ).map(record => record?.data); // avoids having to do ?.data in the prop later

  return { logo, signingImage: footerAssetData || signingImage, watermark };
}

async function renderPdf(element, fileName) {
  const folder = await tmpdir();
  const filePath = path.join(folder, fileName);

  await ReactPDF.render(element, filePath);
  return {
    status: 'success',
    filePath,
  };
}

async function getPatientVaccines(models, patient) {
  const { data: vaccines } = await patient.getAdministeredVaccines({
    order: [['date', 'ASC']],
    includeNotGiven: false,
  });
  const vaccineData = vaccines.filter(vaccine => !vaccine.scheduledVaccine.hideFromCertificate);
  const certifiableVaccines = vaccineData.filter(vaccine => vaccine.certifiable);
  const additionalData = await models.PatientAdditionalData.findOne({
    where: { patientId: patient.id },
    include: models.PatientAdditionalData.getFullReferenceAssociations(),
  });
  const village = await models.ReferenceData.findByPk(patient.villageId, {});
  const patientData = {
    ...patient.dataValues,
    village,
    additionalData: additionalData?.dataValues,
  };
  return { certifiableVaccines, vaccines: vaccineData, patientData };
}

export const makeCovidVaccineCertificate = async (
  patient,
  printedBy,
  printedDate,
  models,
  uvci,
  qrData = null,
  language,
) => {
  const localisation = await getLocalisation();
  const getSetting = key => '#TODO settings';
  const getLocalisationData = key => get(localisation, key);

  const fileName = `covid-vaccine-certificate-${patient.id}.pdf`;
  const { logo, signingImage, watermark } = await getCertificateAssets(
    models,
    ASSET_NAMES.COVID_VACCINATION_CERTIFICATE_FOOTER,
  );
  const { certifiableVaccines, patientData } = await getPatientVaccines(models, patient);
  const vds = qrData ? await QRCode.toDataURL(qrData) : null;

  return renderPdf(
    <CovidVaccineCertificate
      patient={patientData}
      printedBy={printedBy}
      printedDate={printedDate}
      uvci={uvci}
      vaccinations={certifiableVaccines}
      signingSrc={signingImage}
      watermarkSrc={watermark}
      logoSrc={logo}
      vdsSrc={vds}
      getLocalisation={getLocalisationData}
      getSetting={getSetting}
      language={language}
    />,
    fileName,
  );
};

export const makeVaccineCertificate = async (
  patient,
  printedBy,
  printedDate,
  facilityName,
  models,
  language,
  translations,
) => {
  const localisation = await getLocalisation();

  const fileName = `vaccine-certificate-${patient.id}.pdf`;
  const { logo, signingImage, watermark } = await getCertificateAssets(
    models,
    ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER,
  );
  const { vaccines, patientData } = await getPatientVaccines(models, patient);

  return renderPdf(
    <VaccineCertificate
      patient={patientData}
      printedBy={printedBy}
      printedDate={printedDate}
      vaccinations={vaccines}
      facilityName={facilityName}
      signingSrc={signingImage}
      watermarkSrc={watermark}
      logoSrc={logo}
      translations={translations}
      localisation={localisation}
      language={language}
    />,
    fileName,
  );
};

export const makeCovidCertificate = async (
  certType,
  patient,
  printedBy,
  models,
  vdsData = null,
  language,
) => {
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const fileName = `covid-${certType}-certificate-${patient.id}.pdf`;
  const footerAssetName =
    certType === CertificateTypes.test
      ? ASSET_NAMES.COVID_TEST_CERTIFICATE_FOOTER
      : ASSET_NAMES.COVID_CLEARANCE_CERTIFICATE_FOOTER;
  const { logo, signingImage, watermark } = await getCertificateAssets(models, footerAssetName);
  const vds = vdsData ? await QRCode.toDataURL(vdsData) : null;
  const additionalData = await models.PatientAdditionalData.findOne({
    where: { patientId: patient.id },
    include: models.PatientAdditionalData.getFullReferenceAssociations(),
  });
  const passportFromSurveyResponse = await getPatientSurveyResponseAnswer(
    models,
    patient.id,
    config?.questionCodeIds?.passport,
  );

  const nationalityId = await getPatientSurveyResponseAnswer(
    models,
    patient.id,
    config?.questionCodeIds?.nationalityId,
  );

  const nationalityRecord = await models.ReferenceData.findByPk(nationalityId);
  const nationalityFromSurveyResponse = nationalityRecord?.dataValues?.name;

  const patientData = {
    ...patient.dataValues,
    additionalData: {
      ...additionalData?.dataValues,
      passport: additionalData?.dataValues?.passport || passportFromSurveyResponse,
      nationality: {
        name: additionalData?.dataValues?.nationality?.name || nationalityFromSurveyResponse,
      },
    },
  };

  const labs =
    certType === CertificateTypes.test
      ? await patient.getCovidLabTests()
      : await patient.getCovidClearanceLabTests();

  return renderPdf(
    <CovidLabCertificate
      patient={patientData}
      labs={labs}
      signingSrc={signingImage}
      watermarkSrc={watermark}
      logoSrc={logo}
      printedBy={printedBy}
      vdsSrc={vds}
      getLocalisation={getLocalisationData}
      certType={certType}
      language={language}
    />,
    fileName,
  );
};
