import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import QRCode from 'qrcode';
import { get } from 'lodash';
import config from 'config';

import { CovidLabCertificate, CertificateTypes } from 'shared/utils/patientCertificates';
import {
  tmpdir,
  VaccineCertificate,
  getPatientSurveyResponseAnswer,
  CovidVaccineCertificate,
} from 'shared/utils';
import { getLocalisation } from '../localisation';

async function getCertificateAssets(models) {
  const [logo, signingImage, watermark] = (
    await Promise.all(
      [
        'letterhead-logo',
        'certificate-bottom-half-img',
        'vaccine-certificate-watermark',
      ].map(name => models.Asset.findOne({ raw: true, where: { name } })),
    )
  ).map(record => record?.data); // avoids having to do ?.data in the prop later

  return { logo, signingImage, watermark };
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
  const vaccines = await patient.getAdministeredVaccines({
    order: [['date', 'ASC']],
    includeNotGiven: false,
  });
  const certifiableVaccines = vaccines.filter(vaccine => vaccine.certifiable);
  const additionalData = await models.PatientAdditionalData.findOne({
    where: { patientId: patient.id },
    include: models.PatientAdditionalData.getFullReferenceAssociations(),
  });
  const patientData = { ...patient.dataValues, additionalData: additionalData?.dataValues };
  return { certifiableVaccines, vaccines, patientData };
}

export const makeCovidVaccineCertificate = async (
  patient,
  printedBy,
  models,
  uvci,
  qrData = null,
) => {
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const fileName = `covid-vaccine-certificate-${patient.id}.pdf`;
  const { logo, signingImage, watermark } = await getCertificateAssets(models);
  const { certifiableVaccines, patientData } = await getPatientVaccines(models, patient);
  const vds = qrData ? await QRCode.toDataURL(qrData) : null;

  return renderPdf(
    <CovidVaccineCertificate
      patient={patientData}
      printedBy={printedBy}
      uvci={uvci}
      vaccinations={certifiableVaccines}
      signingSrc={signingImage}
      watermarkSrc={watermark}
      logoSrc={logo}
      vdsSrc={vds}
      getLocalisation={getLocalisationData}
    />,
    fileName,
  );
};

export const makeVaccineCertificate = async (patient, printedBy, models) => {
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const fileName = `vaccine-certificate-${patient.id}.pdf`;
  const { logo, signingImage, watermark } = await getCertificateAssets(models);
  const { vaccines, patientData } = await getPatientVaccines(models, patient);

  return renderPdf(
    <VaccineCertificate
      patient={patientData}
      printedBy={printedBy}
      vaccinations={vaccines}
      signingSrc={signingImage}
      watermarkSrc={watermark}
      logoSrc={logo}
      getLocalisation={getLocalisationData}
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
) => {
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const fileName = `covid-${certType}-certificate-${patient.id}.pdf`;
  const { logo, signingImage, watermark } = await getCertificateAssets(models);
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
    />,
    fileName,
  );
};
