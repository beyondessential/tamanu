import ReactPDF from '@react-pdf/renderer';
import { PatientLetter, tmpdir } from '@tamanu/shared/utils';
import { get } from 'lodash';
import path from 'path';
import React from 'react';
import { v4 as uuid } from 'uuid';

export const makePatientLetter = async (req, { id, facilityId, ...data }) => {
  const { getLocalisation, models } = req;
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);
  const letterheadConfig = await models.Setting.get('templates.letterhead', facilityId);

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
      letterheadConfig={letterheadConfig}
    />,
    filePath,
  );

  return {
    filePath,
    mimeType: 'application/pdf',
  };
};
