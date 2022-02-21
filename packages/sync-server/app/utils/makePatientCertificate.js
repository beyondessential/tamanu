import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import config from 'config';
import path from 'path';
import { get } from 'lodash';
import QRCode from 'qrcode';
import { log } from 'shared/services/logging';
import { tmpdir, CovidLabCertificate, VaccineCertificate } from 'shared/utils';

const getLocalisation = key => {
  const { localisation } = config;
  return get(localisation.data, key);
};

export const makeVaccineCertificate = async (patient, models, vdsData = null) => {
  const folder = await tmpdir();
  const fileName = `vaccine-certificate-${patient.id}.pdf`;
  const filePath = path.join(folder, fileName);

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

    await ReactPDF.render(
      <VaccineCertificate
        patient={patient.dataValues}
        vaccinations={vaccinations}
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
  const folder = await tmpdir();
  const fileName = `covid-test-certificate-${patient.id}.pdf`;
  const filePath = path.join(folder, fileName);

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
      <CovidLabCertificate
        patient={patient.dataValues}
        labs={labs}
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
