import { replaceInTemplate } from '../../src/utils/replaceInTemplate';

describe('replaceInTemplate', () => {
  it('should replace correctly', () => {
    expect(replaceInTemplate('Hi $name$', { name: 'William' })).toEqual('Hi William');
  });

  it('should replace more than once', () => {
    const replacements = { name: 'William', occupation: 'pharmacist', earnings: 100 };
    expect(replaceInTemplate('$name$: $occupation$', replacements)).toEqual('William: pharmacist');
  });

  it('should replace correctly with dollars in the template', () => {
    const replacements = { name: 'William', occupation: 'pharmacist', earnings: 100 };
    expect(replaceInTemplate('$name$: $$earnings$', replacements)).toEqual('William: $100');
  });

  it('should work with empty templateString', () => {
    expect(replaceInTemplate('', { name: 'William' })).toEqual('');
  });

  it('should work with empty replacements', () => {
    expect(replaceInTemplate('Hi $name$', {})).toEqual('Hi $name$');
    expect(replaceInTemplate('Hi $name$', null)).toEqual('Hi $name$');
  });
});
