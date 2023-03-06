import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import QRCode from 'qrcode';
import { get } from 'lodash';
import config from 'config';

import { log } from 'shared/services/logging';
import {
  tmpdir,
  VaccineCertificate,
  getPatientSurveyResponseAnswer,
  CovidVaccineCertificate,
} from 'shared/utils';
import { CovidLabCertificate } from 'shared/utils/patientCertificates';
import { getLocalisation } from '../localisation';

export const makeCovidVaccineCertificate = async (
  patient,
  printedBy,
  models,
  uvci,
  qrData = null,
) => {
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const folder = await tmpdir();
  const fileName = `covid-vaccine-certificate-${patient.id}.pdf`;
  const filePath = path.join(folder, fileName);

  const logo = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'letterhead-logo',
    },
  });

  const signingImage = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'certificate-bottom-half-img',
    },
  });

  const watermark = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'vaccine-certificate-watermark',
    },
  });

  const vds = qrData ? await QRCode.toDataURL(qrData) : null;

  try {
    const vaccinations = await patient.getAdministeredVaccines();
    const certifiableVaccines = vaccinations.filter(vaccine => vaccine.certifiable);
    const additionalData = await models.PatientAdditionalData.findOne({
      where: { patientId: patient.id },
      include: models.PatientAdditionalData.getFullReferenceAssociations(),
    });
    const patientData = { ...patient.dataValues, additionalData: additionalData?.dataValues };

    await ReactPDF.render(
      <CovidVaccineCertificate
        patient={patientData}
        printedBy={printedBy}
        uvci={uvci}
        vaccinations={certifiableVaccines}
        signingSrc={signingImage?.data}
        watermarkSrc={watermark?.data}
        logoSrc={logo?.data}
        vdsSrc={vds}
        getLocalisation={getLocalisationData}
      />,
      filePath,
    );
  } catch (error) {
    log.info(`Error creating Patient Certificate ${patient.id}`);
    throw error;
  }

  return {
    status: 'success',
    filePath,
  };
};

export const makeVaccineCertificate = async (patient, printedBy, models) => {
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const folder = await tmpdir();
  const fileName = `vaccine-certificate-${patient.id}.pdf`;
  const filePath = path.join(folder, fileName);

  const logo = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'letterhead-logo',
    },
  });

  const signingImage = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'certificate-bottom-half-img',
    },
  });

  const watermark = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'vaccine-certificate-watermark',
    },
  });

  try {
    const vaccinations = await patient.getAdministeredVaccines()
    vaccinations.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    const additionalData = await models.PatientAdditionalData.findOne({
      where: { patientId: patient.id },
      include: models.PatientAdditionalData.getFullReferenceAssociations(),
    });
    const patientData = { ...patient.dataValues, additionalData: additionalData?.dataValues };

    await ReactPDF.render(
      <VaccineCertificate
        patient={patientData}
        printedBy={printedBy}
        vaccinations={vaccinations}
        signingSrc={signingImage?.data}
        watermarkSrc={watermark?.data}
        logoSrc={logo?.data}
        getLocalisation={getLocalisationData}
      />,
      filePath,
    );
  } catch (error) {
    log.info(`Error creating Patient Certificate ${patient.id}`);
    throw error;
  }

  return {
    status: 'success',
    filePath,
  };
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

  const folder = await tmpdir();
  const fileName = `covid-${certType}-certificate-${patient.id}.pdf`;
  const filePath = path.join(folder, fileName);

  const logo = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'letterhead-logo',
    },
  });

  const signingImage = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'certificate-bottom-half-img',
    },
  });

  const watermark = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'vaccine-certificate-watermark',
    },
  });

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

  try {
    const labs = await patient.getCovidLabTests();
    await ReactPDF.render(
      <CovidLabCertificate
        patient={patientData}
        labs={labs}
        signingSrc={signingImage?.data}
        watermarkSrc={watermark?.data}
        logoSrc={logo?.data}
        printedBy={printedBy}
        vdsSrc={vds}
        getLocalisation={getLocalisationData}
        certType={certType}
      />,
      filePath,
    );
  } catch (error) {
    log.info(`Error creating Patient Certificate ${patient.id}`);
    throw error;
  }

  return {
    status: 'success',
    filePath,
  };
};
