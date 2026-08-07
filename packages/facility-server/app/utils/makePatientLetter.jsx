import React from 'react';
import crypto from 'crypto';
import path from 'path';
import ReactPDF from '@react-pdf/renderer';
import { get } from 'es-toolkit/compat';
import { Op } from 'sequelize';

import { ASSET_NAMES, SETTING_KEYS } from '@tamanu/constants';
import { NotFoundError, RemoteUnreachableError } from '@tamanu/errors';
import { PatientLetter } from '@tamanu/shared/utils/patientLetters/PatientLetter';
import { tmpdir } from '@tamanu/shared/utils/tmpdir';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { resolveAssetImageData } from '@tamanu/shared/utils/assets';

export const makePatientLetter = async (req, { id, facilityId, ...data }) => {
  const { getLocalisation, models, language, dateTimeLocale, settings, blobCache } = req;
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
  const logoData = await resolveAssetImageData(logo, hash => openAssetBlob(blobCache, hash));

  const folder = await tmpdir();
  const fileName = `patient-letter-${id}-${crypto.randomUUID()}.pdf`;
  const filePath = path.join(folder, fileName);

  await ReactPDF.render(
    <PatientLetter
      getLocalisation={getLocalisationData}
      data={data}
      logoSrc={logoData}
      letterheadConfig={letterheadConfig}
      language={language}
      dateTimeLocale={dateTimeLocale}
      getSetting={getSettingData}
      primaryTimeZone={getPrimaryTimeZone()}
    />,
    filePath,
  );

  return {
    filePath,
    mimeType: 'application/pdf',
  };
};

// spec: ASSET
// The letterhead read-through: bytes held locally, or fetched from central on a
// miss. When the bytes cannot be resolved (absent locally and not fetchable) the
// letter fails rather than printing without the letterhead, so an unbranded
// document never goes out unnoticed. Reported as unreachable-upstream rather
// than not-found, so it stays distinguishable from this route's 404s for a
// missing encounter or clinician.
async function openAssetBlob(blobCache, hash) {
  if (!blobCache) {
    throw new RemoteUnreachableError(`Asset image ${hash} is not yet available`);
  }
  try {
    return await blobCache.open(hash);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new RemoteUnreachableError(`Asset image ${hash} is not yet available`);
    }
    throw error;
  }
}
