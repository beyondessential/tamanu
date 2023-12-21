import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';
import { v4 as uuid } from 'uuid';
import { tmpdir, PatientLetter } from '@tamanu/shared/utils';

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
  const fileName = `patient-letter-${id}-${uuid()}.pdf`;
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
