import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';
import { Op } from 'sequelize';

import { ASSET_NAMES, SETTING_KEYS } from '@tamanu/constants';
import { PatientLetter, tmpdir } from '@tamanu/shared/utils';
import crypto from 'crypto';

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
      name: ASSET_NAMES.LETTERHEAD_LOGO,
      facilityId: { [Op.or]: [facilityId, null] },
    },
    order: [['facilityId', 'ASC NULLS LAST']],
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
