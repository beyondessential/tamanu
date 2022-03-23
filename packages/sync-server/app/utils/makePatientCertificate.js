import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import QRCode from 'qrcode';
import { get } from 'lodash';
import config from 'config';

import { log } from 'shared/services/logging';
import {
  tmpdir,
  CovidLabCertificate,
  VaccineCertificate,
  getPatientSurveyResponseAnswer,
} from 'shared/utils';
import { generateUVCIForPatient } from '../integrations/VdsNc';
import { getLocalisation } from '../localisation';

export const makeVaccineCertificate = async (patient, printedBy, models, vdsData = null) => {
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

  const vds = vdsData ? await QRCode.toDataURL(vdsData) : null;

  try {
    const vaccinations = await patient.getAdministeredVaccines();
    const additionalData = await models.PatientAdditionalData.findOne({
      where: { patientId: patient.id },
      include: models.PatientAdditionalData.getFullReferenceAssociations(),
    });
    const patientData = { ...patient.dataValues, additionalData: additionalData?.dataValues };
    const uvci = await generateUVCIForPatient(patient.id);

    await ReactPDF.render(
      <VaccineCertificate
        patient={patientData}
        printedBy={printedBy}
        extraPatientFields={[{ key: 'uvci', label: 'UVCI', accessor: () => uvci }]}
        vaccinations={vaccinations}
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

export const makeCovidTestCertificate = async (patient, printedBy, models, vdsData = null) => {
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const folder = await tmpdir();
  const fileName = `covid-test-certificate-${patient.id}.pdf`;
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
  const passportSurveyResponse = await getPatientSurveyResponseAnswer(
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
  const nationalitySurveyResponse = nationalityRecord?.dataValues?.name;

  const patientData = {
    ...patient.dataValues,
    additionalData: {
      ...additionalData?.dataValues,
      passport: additionalData?.dataValues?.passport || passportSurveyResponse,
      nationality: {
        name: additionalData?.dataValues?.nationality?.name || nationalitySurveyResponse,
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
