// import fs, { promises as asyncFs } from 'fs';
// import { InvalidParameterError, RemoteCallFailedError } from 'shared/errors';
// import { getUploadedData } from 'shared/utils/getUploadedData';
// import { CentralServerConnection } from '../sync';

import React from 'react';
import ReactPDF, { Document, Page } from '@react-pdf/renderer';
import path from 'path';
import QRCode from 'qrcode';
import { get } from 'lodash';
import config from 'config';

import { styles, Col, Box, Row, Watermark } from 'shared/utils/patientCertificates/Layout';
import { H3, P } from 'shared/utils/patientCertificates/Typography';
import { log } from 'shared/services/logging';
import { tmpdir, VaccineCertificate, getPatientSurveyResponseAnswer } from 'shared/utils';
import { CovidLabCertificate, CertificateTypes } from 'shared/utils/patientCertificates';

const TestPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <H3>Patient Letter</H3>
    </Page>
  </Document>
);


export const makePatientLetter = async ({ patientId, ...data}) => {
  const folder = await tmpdir();
  // TODO: add millies to filename (or just uuid)?
  const fileName = `patient-letter-${patientId}.pdf`;
  const filePath = path.join(folder, fileName);


  try {
    await ReactPDF.render(
      <TestPDF />,
      filePath,
    );
  } catch (error) {
    log.info('Error creating PDF');
    throw error;
  }

  return {
    status: 'success',
    filePath,
  };
};

// export const makeVaccineCertificate = async (patient, printedBy, models, uvci, qrData = null) => {
//   const localisation = await getLocalisation();
//   const getLocalisationData = key => get(localisation, key);

//   const folder = await tmpdir();
//   const fileName = `vaccine-certificate-${patient.id}.pdf`;
//   const filePath = path.join(folder, fileName);

//   const logo = await models.Asset.findOne({
//     raw: true,
//     where: {
//       name: 'letterhead-logo',
//     },
//   });

//   const signingImage = await models.Asset.findOne({
//     raw: true,
//     where: {
//       name: 'certificate-bottom-half-img',
//     },
//   });

//   const watermark = await models.Asset.findOne({
//     raw: true,
//     where: {
//       name: 'vaccine-certificate-watermark',
//     },
//   });

//   const vds = qrData ? await QRCode.toDataURL(qrData) : null;

//   try {
//     const vaccinations = await patient.getAdministeredVaccines();
//     const additionalData = await models.PatientAdditionalData.findOne({
//       where: { patientId: patient.id },
//       include: models.PatientAdditionalData.getFullReferenceAssociations(),
//     });
//     const patientData = { ...patient.dataValues, additionalData: additionalData?.dataValues };

//     await ReactPDF.render(
//       <VaccineCertificate
//         patient={patientData}
//         printedBy={printedBy}
//         uvci={uvci}
//         vaccinations={vaccinations}
//         signingSrc={signingImage?.data}
//         watermarkSrc={watermark?.data}
//         logoSrc={logo?.data}
//         vdsSrc={vds}
//         getLocalisation={getLocalisationData}
//       />,
//       filePath,
//     );
//   } catch (error) {
//     log.info(`Error creating Patient Certificate ${patient.id}`);
//     throw error;
//   }

//   return {
//     status: 'success',
//     filePath,
//   };
// };