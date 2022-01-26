import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import { log } from 'shared/services/logging';
import { CovidCertificate } from './CovidCertificate';

const getFilePath = patient => {
  const fileName = `covid-certificate-${patient.id}`;
  return `./patientCertificates/${fileName}.pdf`;
};

export const makePatientCertificate = async patient => {
  await fs.promises.mkdir('./patientCertificates', { recursive: true });

  const labs = await patient.getLabRequests();
  const data = {
    ...patient.dataValues,
    labs,
  };
  const filePath = getFilePath(patient);

  try {
    await ReactPDF.render(<CovidCertificate data={data} />, filePath);
  } catch (error) {
    log.info(`Error creating Patient Certificate ${patient.id}`);
  }

  return {
    status: 'success',
    filePath,
  };
};
