// import fs, { promises as asyncFs } from 'fs';
// import { InvalidParameterError, RemoteCallFailedError } from 'shared/errors';
// import { getUploadedData } from 'shared/utils/getUploadedData';
// import { CentralServerConnection } from '../sync';

import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import QRCode from 'qrcode';
import { get } from 'lodash';
import config from 'config';

import { log } from 'shared/services/logging';
import { tmpdir, VaccineCertificate, getPatientSurveyResponseAnswer } from 'shared/utils';
import { CovidLabCertificate, CertificateTypes } from 'shared/utils/patientCertificates';

import { getLocalisation } from '../localisation';


// // Helper function for uploading one file to the sync server
// // req: express request, maxFileSize: integer (size in bytes)
// export const uploadAttachment = async (req, maxFileSize) => {
//   // TODO: Figure out permission management for writing
//   // an Attachment
//   // req.checkPermission('write', 'Attachment'); ??

//   // Read request and extract file, stats and metadata
//   const { deviceId } = req;
//   const { file, deleteFileAfterImport, attachmentType, ...metadata } = await getUploadedData(req);
//   const { size } = fs.statSync(file);
//   const fileData = await asyncFs.readFile(file, { encoding: 'base64' });

//   // Parsed file needs to be deleted from memory
//   if (deleteFileAfterImport) fs.unlink(file, () => null);

//   // Check file size constraint
//   if (maxFileSize && size > maxFileSize) {
//     throw new InvalidParameterError(`Uploaded file exceeds limit of ${maxFileSize} bytes.`);
//   }

//   // Upload file to sync server
//   // CentralServerConnection takes care of adding headers and convert body to JSON
//   const centralServer = new CentralServerConnection({ deviceId });
//   const syncResponse = await centralServer.fetch('attachment', {
//     method: 'POST',
//     body: {
//       type: attachmentType,
//       size,
//       data: fileData,
//     },
//     backoff: { maxAttempts: 1 },
//   });

//   if (syncResponse.error) {
//     throw new RemoteCallFailedError(syncResponse.error.message);
//   }

//   // Send parsed metadata along with the new created attachment id
//   return {
//     attachmentId: syncResponse.attachmentId,
//     metadata,
//   };
// };

export const createPDF = data => 'hi';


const TestPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      hi
    </Page>
  </Document>
);


export const makePatientLetter = async (data) => {
  const folder = await tmpdir();
  const fileName = `vaccine-certificate-${patient.id}.pdf`;
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