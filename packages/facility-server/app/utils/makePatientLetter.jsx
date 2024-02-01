import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';
import { PatientLetter, tmpdir } from '@tamanu/shared/utils';
import crypto from 'crypto';

export const makePatientLetter = async (req, { id, facilityId, ...data }) => {
  const { settings, models } = req;
  const settingsObject = await settings.get();
  const getSetting = key => get(settingsObject, key);
  const letterheadConfig = await settings.get('localisation.templates.letterhead');

  const logo = await models.Asset.findOne({
    raw: true,
    where: {
      name: 'letterhead-logo',
    },
  });

  const folder = await tmpdir();
  const fileName = `patient-letter-${id}-${crypto.randomUUID()}.pdf`;
  const filePath = path.join(folder, fileName);

  await ReactPDF.render(
    <PatientLetter
      getSetting={getSetting}
      data={data}
      logoSrc={logo?.data}
      letterheadConfig={letterheadConfig}
    />,
    filePath,
  );

  return {
    filePath,
    mimeType: 'application/pdf',
  };
};
