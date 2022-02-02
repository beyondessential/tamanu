import React from 'react';
import fs from 'fs';
import { log } from 'shared/services/logging';
import ReactPDF from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { CovidCertificate } from './CovidCertificate';

const getFilePath = patient => {
  const fileName = `covid-certificate-${patient.id}`;
  return `./patientCertificates/${fileName}.pdf`;
};

export const makePatientCertificate = async (patient, models, vdsData = null) => {
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

  const vds = vdsData ? await QRCode.toDataURL(vdsData) : null;

  try {
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
