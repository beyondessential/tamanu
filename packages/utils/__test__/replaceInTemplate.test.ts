import { replaceInTemplate } from '../src/replaceInTemplate';
import { describe, expect, it } from 'vitest';

describe('replaceInTemplate', () => {
  it('should replace placeholders with values', () => {
    const template = 'Hello, $name$!';
    const replacements = { name: 'World' };
    expect(replaceInTemplate(template, replacements)).toBe('Hello, World!');
  });

  it('should replace multiple placeholders', () => {
    const template = '$greeting$, $name$!';
    const replacements = { greeting: 'Hi', name: 'Alice' };
    expect(replaceInTemplate(template, replacements)).toBe('Hi, Alice!');
  });

  it('should leave placeholders if no replacements provided', () => {
    const template = 'Hello, $name$!';
    expect(replaceInTemplate(template, null)).toBe('Hello, $name$!');
  });

  it('should replace placeholders with empty string if value is null or undefined', () => {
    const template = 'Hello, $name$!';
    const replacements = { name: null };
    expect(replaceInTemplate(template, replacements)).toBe('Hello, !');
  });
});
