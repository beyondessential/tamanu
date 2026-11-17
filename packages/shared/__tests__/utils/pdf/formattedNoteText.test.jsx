import React from 'react';
import zlib from 'zlib';
import { describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';

import { EncounterRecordPrintout } from '../../../src/utils/patientCertificates/EncounterRecordPrintout';
import { HandoverNotesPDF } from '../../../src/utils/handoverNotes/HandoverNotesPDF';

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

const readPdf = buffer => {
  const pdf = buffer.toString('latin1');
  const baseFontByObject = Object.fromEntries(
    [...pdf.matchAll(/(\d+) 0 obj\s*<<[^]*?\/BaseFont \/([\w+-]+)/g)].map(([, id, name]) => [
      id,
      name,
    ]),
  );
  const fontByResource = Object.fromEntries(
    [...pdf.matchAll(/\/(F\d+) (\d+) 0 R/g)].map(([, resource, id]) => [
      resource,
      baseFontByObject[id],
    ]),
  );

  const textByFont = {};
  let strokeCount = 0;
  for (const [, stream] of pdf.matchAll(/stream\r?\n([^]*?)\r?\nendstream/g)) {
    let content;
    try {
      content = zlib.inflateSync(Buffer.from(stream, 'latin1')).toString('latin1');
    } catch {
      continue;
    }
    strokeCount += content.match(/^S$/gm)?.length ?? 0;
    let font;
    for (const [, resource, array] of content.matchAll(/\/(F\d+) [\d.]+ Tf|\[(.*?)\] TJ/g)) {
      if (resource) {
        font = fontByResource[resource];
        continue;
      }
      const text = [...array.matchAll(/<([0-9a-f]*)>/g)]
        .map(([, hex]) => Buffer.from(hex, 'hex').toString('latin1'))
        .join('');
      textByFont[font] = (textByFont[font] ?? '') + text;
    }
  }
  return { textByFont, allText: Object.values(textByFont).join(''), strokeCount };
};

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
