import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';
import { PatientLetter, tmpdir } from '@tamanu/shared/utils';
import crypto from 'crypto';
import { SETTING_KEYS } from '@tamanu/constants';

export const makePatientLetter = async (req, { id, facilityId, ...data }) => {
  const { getLocalisation, models, language, settings } = req;
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);
  const letterheadConfig = await settings[facilityId].get(
    SETTING_KEYS.TEMPLATES_LETTERHEAD,
    facilityId,
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
      language={language}
      settings={settings}
    />,
    filePath,
  );

  return {
    filePath,
    mimeType: 'application/pdf',
  };
};
