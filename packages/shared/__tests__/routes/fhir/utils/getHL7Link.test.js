import { getHL7Link } from '../../../../src/routes/fhir/utils/getHL7Link';

describe('getHL7Link', () => {
  const base = 'http://example.com/fhir/Patient';

  it('returns the base URL when no params given', () => {
    expect(getHL7Link(base)).toBe('http://example.com/fhir/Patient');
  });

  it('encodes simple key-value params', () => {
    const result = getHL7Link(base, { name: 'John', _count: '10' });
    const url = new URL(result);
    expect(url.searchParams.get('name')).toBe('John');
    expect(url.searchParams.get('_count')).toBe('10');
  });

  it('repeats keys for array values', () => {
    const result = getHL7Link(base, { _include: ['a', 'b'] });
    const url = new URL(result);
    expect(url.searchParams.getAll('_include')).toEqual(['a', 'b']);
  });

  it('skips null and undefined values', () => {
    const result = getHL7Link(base, { a: 'yes', b: null, c: undefined });
    const url = new URL(result);
    expect(url.searchParams.get('a')).toBe('yes');
    expect(url.searchParams.has('b')).toBe(false);
    expect(url.searchParams.has('c')).toBe(false);
  });

  it('encodes special characters in values', () => {
    const result = getHL7Link(base, { q: 'a&b=c' });
    const url = new URL(result);
    expect(url.searchParams.get('q')).toBe('a&b=c');
  });
});
