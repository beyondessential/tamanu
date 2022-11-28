import { parse } from '../../src/utils/pgComposite/parse';

describe('Composite parser', () => {
  it('should parse empty records', () => {
    expect(parse('()')).toEqual([]);
  });

  it('should parse single-field bare records', () => {
    expect(parse('(hello)')).toEqual(['hello']);
  });

  it('should parse single-field spaced records', () => {
    expect(parse('( 123 )')).toEqual([' 123 ']);
  });

  it('should parse single-field quoted records', () => {
    expect(parse('("world")')).toEqual(['world']);
  });

  it('should parse single-field multi quoted records', () => {
    expect(parse('("hello" "world")')).toEqual(['hello world']);
  });

  it('should parse two bare fields', () => {
    expect(parse('(hello,world)')).toEqual(['hello', 'world']);
  });

  it('should parse three-field spaced records', () => {
    expect(parse('( 123, 456 , 789)')).toEqual([' 123', ' 456 ', ' 789']);
  });

  it('should parse four-field quoted records', () => {
    expect(parse('("hello","brave new","world","!")')).toEqual(['hello', 'brave new', 'world', '!']);
  });

  it('should parse several multi quoted and unquoted records', () => {
    expect(parse('("hello" "world","foo" bar,qux "baz")')).toEqual(['hello world', 'foo bar', 'qux baz']);
  });

  it('should parse quoted with backslash-escape double quote', () => {
    expect(parse('("hello \\" world")')).toEqual(['hello " world']);
  });

  it('should parse quoted with backslash-escape backslash', () => {
    expect(parse('("hello \\\\ world")')).toEqual(['hello \\ world']);
  });

  it('should parse quoted with backslash-escape other thing', () => {
    expect(parse('("hello \\0 world")')).toEqual(['hello 0 world']);
  });

  it('should parse quoted with quote-escape double quote', () => {
    expect(parse('("hello "" world")')).toEqual(['hello " world']);
  });

  it('should parse quoted with backslash-escape double quote at end of string', () => {
    expect(parse('("hello \\"")')).toEqual(['hello "']);
  });

  it('should parse quoted with quote-escape double quote at end of string', () => {
    expect(parse('("hello """)')).toEqual(['hello "']);
  });

  it('should parse quoted with quote-escape double quote at start of string', () => {
    expect(parse('(""" hello")')).toEqual(['" hello']);
  });

  it('should parse trailing empty field', () => {
    expect(parse('(hello,world,)')).toEqual(['hello', 'world', null]);
  });

  it('should parse leading empty field', () => {
    expect(parse('(,hello,world)')).toEqual([null, 'hello', 'world']);
  });

  it('should parse middle empty field', () => {
    expect(parse('(hello,,world)')).toEqual(['hello', null, 'world']);
  });

  it('should parse all empty fields', () => {
    expect(parse('(,,)')).toEqual([null, null, null]);
  });

  it('should parse escaped comma', () => {
    expect(parse('(hello\\, world)')).toEqual(["hello, world"]);
  });

  it('should parse escaped parens', () => {
    expect(parse('(hello \\(bonjour\\) world)')).toEqual(["hello (bonjour) world"]);
  });

  it('should parse empty string field', () => {
    expect(parse('(hello,"",world)')).toEqual(['hello', '', 'world']);
  });

  it('should parse empty quoted in the middle of a bare string', () => {
    expect(parse('(hello "" world)')).toEqual(['hello  world']);
  });

  it('should not parse inside nested composites', () => {
    expect(parse('(usual,,"HE770 WOR7D","(""2022-09-19 10:34:34"",)",)')).toEqual([
      'usual',
      null,
      'HE770 WOR7D',
      '("2022-09-19 10:34:34",)',
      null,
    ]);
  });
});
