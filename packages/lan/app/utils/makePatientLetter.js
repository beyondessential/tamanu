import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';
import { v4 as uuid } from 'uuid';
import { tmpdir, PatientLetter } from '@tamanu/shared/utils';

export const makePatientLetter = async (req, { id, facilityId, ...data }) => {
  const { getLocalisation, models } = req;

  const templates = await models.Setting.get('templates.letterhead', facilityId);

  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);

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
      getLocalisation={getLocalisationData}
      data={data}
      logoSrc={logo?.data}
      letterheadConfig={templates?.data}
    />,
    filePath,
  );

  return {
    filePath,
    mimeType: 'application/pdf',
  };
};
