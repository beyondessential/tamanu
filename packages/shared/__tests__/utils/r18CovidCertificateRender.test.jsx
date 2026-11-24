// Throwaway check for card R18: delete before committing.
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { get } from 'es-toolkit/compat';
import { describe, expect, it } from 'vitest';

import { CovidVaccineCertificate } from '../../src/utils/patientCertificates';

const localisation = { country: { name: 'Utopia' } };
const settings = {
  templates: {
    vaccineCertificate: { emailAddress: 'a@b.c', contactNumber: '123', healthFacility: 'HF' },
    letterhead: { title: 'Title', subTitle: 'Sub' },
  },
  features: { useGlobalPdfFont: false },
};
const getSetting = key => get(settings, key);

const patient = {
  firstName: 'Test',
  lastName: 'Patient',
  dateOfBirth: '1990-01-01',
  sex: 'female',
  displayId: 'ABC123',
  additionalData: {},
};
const vaccinations = [
  {
    date: '2026-11-20 10:00:00',
    batch: 'B1',
    scheduledVaccine: { label: 'COVID-19 Pfizer', doseLabel: 'Dose 1', vaccine: { name: 'Pfizer' } },
  },
];

const commonProps = {
  patient,
  vaccinations,
  printedBy: 'Tester',
  printedDate: '2026-11-24',
  getSetting,
  primaryTimeZone: 'Pacific/Auckland',
};

describe('R18 COVID-19 certificate render', () => {
  it('throws with the props the modal passed before the fix', async () => {
    await expect(
      renderToBuffer(<CovidVaccineCertificate {...commonProps} localisation={localisation} />),
    ).rejects.toThrow(/getLocalisation is not a function/);
  });

  it('renders a PDF with the props the modal passes after the fix', async () => {
    const buffer = await renderToBuffer(
      <CovidVaccineCertificate
        {...commonProps}
        getLocalisation={key => get(localisation, key)}
      />,
    );
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
