import React from 'react';
import crypto from 'crypto';
import path from 'path';
import ReactPDF from '@react-pdf/renderer';
import config from 'config';
import { get } from 'lodash-es';
import { Op } from 'sequelize';

import { ASSET_NAMES, SETTING_KEYS } from '@tamanu/constants';
import { PatientLetter, tmpdir } from '@tamanu/shared/utils';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';

export const makePatientLetter = async (req, { id, facilityId, ...data }) => {
  const { getLocalisation, models, language, dateTimeLocale, settings } = req;
  const localisation = await getLocalisation();
  const getLocalisationData = key => get(localisation, key);
  const settingsObj = await settings[facilityId].getAll();
  const getSettingData = key => get(settingsObj, key);
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
      dateTimeLocale={dateTimeLocale}
      getSetting={getSettingData}
      primaryTimeZone={getPrimaryTimeZone(config)}
    />,
    filePath,
  );

  return {
    filePath,
    mimeType: 'application/pdf',
  };
};
