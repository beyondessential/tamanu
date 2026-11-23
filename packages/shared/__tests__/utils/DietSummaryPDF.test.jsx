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
          bed: 'Bed 1',
          dietKeys: ['regular'],
        },
        {
          encounterId: 'encounter-2',
          displayId: 'TEST002',
          firstName: 'Mele',
          lastName: 'Fifita',
          bed: 'Bed 2',
          dietKeys: ['diet-soft'],
        },
      ],
    },
  ],
};

const renderSheetText = async props => {
  const buffer = await renderToBuffer(
    <DietSummaryPDF
      {...sheet}
      letterheadConfig={{}}
      getSetting={() => undefined}
      primaryTimeZone="Pacific/Palau"
      {...props}
    />,
  );
  return readPdf(buffer).allText;
};

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
});
