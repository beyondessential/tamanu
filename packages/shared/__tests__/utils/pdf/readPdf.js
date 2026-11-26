import zlib from 'zlib';

// Reads back what a rendered PDF draws: its text by font, and how many lines it strokes.
export const readPdf = buffer => {
  const pdf = buffer.toString('latin1');
  const baseFontByObject = Object.fromEntries(
    [...pdf.matchAll(/(\d+) 0 obj\s*<<(?:(?!endobj)[^])*?\/BaseFont \/([\w+-]+)/g)].map(
      ([, id, name]) => [id, name],
    ),
  );
  const fontByResource = Object.fromEntries(
    [...pdf.matchAll(/\/(F\d+) (\d+) 0 R/g)].map(([, resource, id]) => [
      resource,
      baseFontByObject[id],
    ]),
  );

  const textByFont = {};
  let strokeCount = 0;
  // react-pdf writes "\n" on both sides of the stream data, which is binary and can itself end in
  // "\r": allowing "\r\n" here would cut that byte off and make the deflate stream unreadable.
  for (const [, stream] of pdf.matchAll(/stream\n([^]*?)\nendstream/g)) {
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
