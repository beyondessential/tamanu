import { describe, expect, it } from 'vitest';
import { toSafeFileName } from '../../app/utils/files';

describe('toSafeFileName', () => {
  it('leaves an ordinary name alone', () => {
    expect(toSafeFileName('International Patient Summary for Jane Doe.png')).toBe(
      'International Patient Summary for Jane Doe.png',
    );
  });

  it.each([
    ['../../elsewhere/name', 'elsewherename'],
    ['..\\..\\name.ini', 'name.ini'],
    ['a/b\\c', 'abc'],
    ['name\0.png', 'name.png'],
    ['line\nbreak\ttab\x7f', 'linebreaktab'],
    ['re: <report> "x" | y * z?', 're report x  y  z'],
    ['..', ''],
    ['.hidden', 'hidden'],
    [' .hidden', 'hidden'],
    ['name. ', 'name'],
  ])('turns %j into %j', (input, expected) => {
    expect(toSafeFileName(input)).toBe(expected);
  });

  it('keeps dots within a name', () => {
    expect(toSafeFileName('Dr. J. Smith..png')).toBe('Dr. J. Smith..png');
  });
});
