import React from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';

import { EncounterRecordPrintout } from '../../../src/utils/patientCertificates/EncounterRecordPrintout';
import { HandoverNotesPDF } from '../../../src/utils/handoverNotes/HandoverNotesPDF';
import { readPdf } from './readPdf';

const STYLED_CONTENT = '<b>Bold words</b> <i>Italic words</i> <u>Underlined</u> BP <120 <script>';
const PLAIN_CONTENT = 'Bold words Italic words Underlined BP <120 <script>';

const patient = { displayId: 'TEST001', firstName: 'Test', lastName: 'Patient', sex: 'female' };

const renderEncounterRecordNotes = (content, settings = {}) =>
  renderToBuffer(
    <EncounterRecordPrintout
      section="notes"
      patientData={patient}
      certificateData={{}}
      notes={[
        {
          id: 'note-1',
          noteTypeId: 'notetype-other',
          content,
          date: '2026-01-01 09:00:00',
          author: { displayName: 'Test Author' },
        },
      ]}
      vitalsData={[]}
      recordedDates={[]}
      settings={settings}
      primaryTimeZone="Pacific/Auckland"
    />,
  );

const renderHandoverNotes = content =>
  renderToBuffer(
    <HandoverNotesPDF
      handoverNotes={[{ patient, notes: content, createdAt: '2026-01-01 09:00:00' }]}
      locationGroupName="Ward"
      letterheadConfig={{}}
      getSetting={() => undefined}
      primaryTimeZone="Pacific/Auckland"
    />,
  );

// The page footer prints the current time, so the PDF bytes depend on the clock. Pin it to a
// minute whose page stream ends in "\r", which readPdf has to handle.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-19T09:01:00Z'));
});
afterAll(() => vi.useRealTimers());

describe.each([
  ['encounter record', renderEncounterRecordNotes],
  ['handover notes', renderHandoverNotes],
])('%s PDF note content', (_, render) => {
  it('draws each style in its own font and keeps other markup as text', async () => {
    const { textByFont, allText } = readPdf(await render(STYLED_CONTENT));
    expect(textByFont['Helvetica-Bold']).toContain('Bold words');
    expect(textByFont['Helvetica-Oblique']).toBe('Italic words');
    expect(allText).toContain('BP <120 <script>');
    expect(allText).not.toMatch(/<\/?[biu]>/);
  });

  it('underlines underlined text', async () => {
    const styled = readPdf(await render(STYLED_CONTENT));
    const plain = readPdf(await render(PLAIN_CONTENT));
    expect(styled.strokeCount).toBe(plain.strokeCount + 1);
  });
});

it('renders bold but not italic in the global PDF font, which has no italic', async () => {
  const pdf = (
    await renderEncounterRecordNotes(STYLED_CONTENT, { features: { useGlobalPdfFont: true } })
  ).toString('latin1');
  const baseFonts = [...pdf.matchAll(/\/BaseFont \/[A-Z]+\+([\w-]+)/g)].map(([, name]) => name);
  expect(baseFonts).toContain('NotoKufiArabic-Bold');
  expect(baseFonts).toContain('NotoKufiArabic-Regular');
  expect(pdf).not.toMatch(/Oblique/);
});
