import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import QRCode from 'qrcode';
import { log } from 'shared/services/logging';
import { CovidCertificate } from 'shared/utils';

const getFilePath = patient => {
  const fileName = `covid-certificate-${patient.id}`;
  return `./patientCertificates/${fileName}.pdf`;
};

export const makePatientCertificate = async (patient, models) => {
  await fs.promises.mkdir('./patientCertificates', { recursive: true });
  const filePath = getFilePath(patient);

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

  try {
    const vds = await QRCode.toDataURL('Testing');
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
    return error;
  }

  return {
    status: 'success',
    filePath,
  };
};
