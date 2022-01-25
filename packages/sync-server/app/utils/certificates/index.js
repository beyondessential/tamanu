import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import { CovidCertificate } from './CovidCertificate';

const getFileName = patient => {
  return `covid-certificate-${patient.id}`;
};

export const makePatientCertificate = async patient => {
  await fs.promises.mkdir('./patientCertificates', { recursive: true });

  const labs = await patient.getLabRequests();
  const data = {
    ...patient.dataValues,
    labs,
  };
  const fileName = getFileName(patient);
  return ReactPDF.render(<CovidCertificate data={data} />, `./patientCertificates/${fileName}.pdf`);
};
