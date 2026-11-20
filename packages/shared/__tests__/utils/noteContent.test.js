import { describe, expect, it } from 'vitest';
import {
  parseNoteContent,
  serializeNoteContent,
  stripNoteContentStyles,
} from '../../src/utils/noteContent';

const plain = { bold: false, italic: false, underline: false };

describe('parseNoteContent', () => {
  it('returns one plain segment for unstyled content', () => {
    expect(parseNoteContent('Line one\nLine two')).toEqual([
      { text: 'Line one\nLine two', ...plain },
    ]);
  });

  it('returns no segments for empty or missing content', () => {
    expect(parseNoteContent('')).toEqual([]);
    expect(parseNoteContent(null)).toEqual([]);
  });

  it('applies nested styles', () => {
    expect(parseNoteContent('a <b>bold <i>both</i></b> <u>under</u>')).toEqual([
      { text: 'a ', ...plain },
      { text: 'bold ', ...plain, bold: true },
      { text: 'both', ...plain, bold: true, italic: true },
      { text: ' ', ...plain },
      { text: 'under', ...plain, underline: true },
    ]);
  });

  it('keeps other angle-bracket text literal', () => {
    expect(parseNoteContent('BP <120, <script>x</script>, <B>caps</B>, <br>')).toEqual([
      { text: 'BP <120, <script>x</script>, <B>caps</B>, <br>', ...plain },
    ]);
  });

  it('ignores a stray closing tag', () => {
    expect(parseNoteContent('a</b>b')).toEqual([
      { text: 'a', ...plain },
      { text: 'b', ...plain },
    ]);
  });
});

describe('stripNoteContentStyles', () => {
  it('removes only the style tags', () => {
    expect(stripNoteContentStyles('<b>BP</b> <120 <i>today</i>')).toBe('BP <120 today');
  });

  it('treats missing content as empty', () => {
    expect(stripNoteContentStyles(undefined)).toBe('');
  });
});

describe('serializeNoteContent', () => {
  it('round-trips parsed content', () => {
    const content = 'a <b>bold <i>both</i></b>\n<u>under</u> BP <120';
    expect(serializeNoteContent(parseNoteContent(content))).toBe(content);
  });

  it('merges adjacent segments with the same style', () => {
    expect(
      serializeNoteContent([
        { text: 'one ', ...plain, bold: true },
        { text: 'two', ...plain, bold: true },
      ]),
    ).toBe('<b>one two</b>');
  });

  it('reopens tags when an outer style ends first', () => {
    expect(
      serializeNoteContent([
        { text: 'x', ...plain, bold: true, italic: true },
        { text: 'y', ...plain, italic: true },
      ]),
    ).toBe('<b><i>x</i></b><i>y</i>');
  });

  it('drops empty segments', () => {
    expect(serializeNoteContent([{ text: '', ...plain, bold: true }])).toBe('');
  });
});
