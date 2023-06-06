import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import path from 'path';
import { get } from 'lodash';
import { v4 as uuid } from 'uuid';
import { log } from 'shared/services/logging';
import { tmpdir, PatientLetter } from 'shared/utils';

export const makePatientLetter = async (req, { id, ...data }) => {
  const { getLocalisation, models } = req;
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

  try {
    await ReactPDF.render(
      <PatientLetter getLocalisation={getLocalisationData} data={data} logoSrc={logo} />,
      filePath,
    );
  } catch (error) {
    log.info('Error creating PDF');
    throw error;
  }

  return {
    status: 'success',
    filePath,
  };
};
