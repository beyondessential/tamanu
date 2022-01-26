import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import { log } from 'shared/services/logging';
import { CovidCertificate } from './CovidCertificate';

const getFilePath = patient => {
  const fileName = `covid-certificate-${patient.id}`;
  return `./patientCertificates/${fileName}.pdf`;
};

export const makePatientCertificate = async (patient, models) => {
  await fs.promises.mkdir('./patientCertificates', { recursive: true });

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

  const labs = await patient.getLabRequests();
  const data = {
    ...patient.dataValues,
    labs,
  };
  const filePath = getFilePath(patient);

  try {
    await ReactPDF.render(
      <CovidCertificate signingImage={signingImage} watermark={watermark} data={data} />,
      filePath,
    );
  } catch (error) {
    log.info(`Error creating Patient Certificate ${patient.id}`);
  }

  return {
    status: 'success',
    filePath,
  };
};
