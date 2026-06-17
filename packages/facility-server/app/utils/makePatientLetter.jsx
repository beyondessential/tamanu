import React from 'react';
import crypto from 'crypto';
import path from 'path';
import ReactPDF from '@react-pdf/renderer';
import config from 'config';
import { get } from 'lodash-es';
import { Op } from 'sequelize';

import { ASSET_NAMES, SETTING_KEYS } from '@tamanu/constants';
import { PatientLetter } from '@tamanu/shared/utils/patientLetters/PatientLetter';
import { tmpdir } from '@tamanu/shared/utils/tmpdir';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';

// `render` is injectable so tests can capture the rendered element without mocking the
// `@react-pdf/renderer` module: the module-scoped `ReactPDF` import binds before a test's
// `jest.mock` can intercept it, so a module mock does not reliably reach this call site;
// injection sidesteps that.
export const makePatientLetter = async (
  req,
  { id, facilityId, ...data },
  { render = ReactPDF.render } = {},
) => {
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

  await render(
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
