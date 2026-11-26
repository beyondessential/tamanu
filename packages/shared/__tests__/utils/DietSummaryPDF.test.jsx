import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';

import { DietSummaryPDF } from '../../src/utils/dietSummary/DietSummaryPDF';
import { readPdf } from './pdf/readPdf';

const sheet = {
  columns: [
    { key: 'regular', name: null, isRegular: true },
    { key: 'diet-soft', name: 'Soft', isRegular: false },
  ],
  hospitalTotals: { regular: 1, 'diet-soft': 1 },
  areas: [
    {
      id: 'ward-1',
      name: 'Ward 1',
      subTotals: { regular: 1, 'diet-soft': 1 },
      patients: [
        {
          encounterId: 'encounter-1',
          displayId: 'TEST001',
          firstName: 'Sione',
          lastName: 'Tupou',
          dateOfBirth: '1984-03-02',
          bed: 'Bed 1',
          dietKeys: ['regular'],
        },
        {
          encounterId: 'encounter-2',
          displayId: 'TEST002',
          firstName: 'Mele',
          lastName: 'Fifita',
          dateOfBirth: null,
          bed: 'Bed 2',
          dietKeys: ['diet-soft'],
        },
      ],
    },
  ],
};

const settings = {
  ageDisplayFormat: [{ as: 'years', range: { min: { duration: { days: 0 } } } }],
};

const renderSheetText = async props => {
  const buffer = await renderToBuffer(
    <DietSummaryPDF
      {...sheet}
      letterheadConfig={{}}
      getSetting={key => settings[key]}
      primaryTimeZone="Pacific/Palau"
      {...props}
    />,
  );
  return readPdf(buffer).allText;
};

const countOf = (text, phrase) => text.split(phrase).length - 1;

describe('DietSummaryPDF', () => {
  it('opens a whole-facility sheet with the Hospital total row', async () => {
    const text = await renderSheetText();

    expect(text).toContain('Hospital total');
    expect(text).toContain('Sub total');
  });

  it('leaves the Hospital total row off a sheet filtered by area', async () => {
    const text = await renderSheetText({ isFilteredByArea: true });

    expect(text).not.toContain('Hospital total');
    expect(text).toContain('Sub total');
    expect(text).toContain('Sione Tupou');
  });

  it('keeps a ward that fits its page under its own name alone', async () => {
    const text = await renderSheetText();

    expect(text).not.toContain('(continued)');
    expect(countOf(text, 'Patient name')).toBe(1);
  });

  it('continues a ward past a page break under its name, with the column headers repeated', async () => {
    const [ward] = sheet.areas;
    const patients = Array.from({ length: 60 }, (_, index) => ({
      ...ward.patients[0],
      encounterId: `encounter-${index}`,
    }));

    const text = await renderSheetText({ areas: [{ ...ward, patients }] });

    expect(text).toContain('Ward 1 (continued)');
    expect(countOf(text, 'Patient name')).toBeGreaterThan(1);
    expect(countOf(text, 'Soft')).toBeGreaterThan(2);
  });

  it('prints each patient’s age after their name', async () => {
    const text = await renderSheetText();

    expect(text).toMatch(/Sione Tupou \(\d+ years\)/);
    expect(text).toContain('Mele Fifita');
    expect(text).not.toContain('Mele Fifita (');
  });
});
