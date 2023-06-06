import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';

import { log } from 'shared/services/logging';
import { tmpdir } from 'shared/utils';
import { PatientLetter } from 'shared/utils';


export const makePatientLetter = async (req, { id, ...data }) => {
  const { getLocalisation, models } = req;
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

  const logo = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'letterhead-logo',
    },
  });


  const folder = await tmpdir();
  // TODO: add millies to filename (or just uuid)?
  const fileName = `patient-letter-${id}.pdf`;
  const filePath = path.join(folder, fileName);


  try {
    await ReactPDF.render(
      <PatientLetter getLocalisation={getLocalisationData} data={data} logo={logo} />,
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