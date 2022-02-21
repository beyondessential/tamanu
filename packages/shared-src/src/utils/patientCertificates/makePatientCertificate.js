import React from 'react';
import config from 'config';
import fs from 'fs';
import { get } from 'lodash';
import QRCode from 'qrcode';
import { log } from 'shared/services/logging';
import ReactPDF from '@react-pdf/renderer';
import { CovidCertificate } from './CovidCertificate';
import { VaccineCertificate } from './VaccineCertificate';

const getLocalisation = path => {
  const { localisation } = config;
  return get(localisation.data, path);
};

export const makeVaccineCertificate = async (patient, models, vdsData = null) => {
  await fs.promises.mkdir('./patientCertificates', { recursive: true });
  const filePath = `./patientCertificates/vaccine-certificate-${patient.id}.pdf`;

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
    const immunisations = await patient.getAdministeredVaccines();

    await ReactPDF.render(
      <VaccineCertificate
        patient={patient.dataValues}
        immunisations={immunisations}
        signingSrc={signingImage?.data}
        watermarkSrc={watermark?.data}
        vdsSrc={vds}
        getLocalisation={getLocalisation}
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

export const makeCovidTestCertificate = async (patient, models, vdsData = null) => {
  await fs.promises.mkdir('./patientCertificates', { recursive: true });
  const filePath = `./patientCertificates/covid-certificate-${patient.id}.pdf`;

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
    const labs = await patient.getLabRequests();
    await ReactPDF.render(
      <CovidCertificate
        patient={patient.dataValues}
        labs={labs}
        signingSrc={signingImage?.data}
        watermarkSrc={watermark?.data}
        vdsSrc={vds}
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
