import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';
import { PatientLetter, tmpdir } from '@tamanu/shared/utils';
import crypto from 'crypto';
import { SETTINGS_SCOPES } from '@tamanu/constants';

export const makePatientLetter = async (req, { id, facilityId, ...data }) => {
  const { getLocalisation, models } = req;
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);
  const letterheadConfig = await models.Setting.get(
    'templates.letterhead',
    facilityId,
    SETTINGS_SCOPES.FACILITY,
  );

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
