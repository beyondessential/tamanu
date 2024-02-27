import { describe, expect, test } from 'vitest';
import { checkIsURLCambodia } from '../../app/utils/cambodiaMode';

describe('cambodia mode', () => {
  test.each([
    ['https://khmer.tamanu.io', true],
    ['https://cambodia.tamanu.io', true],
    ['https://cambodia-demo.tamanu.io', true],
    ['https://cambodiademo.tamanu.io', true],
  ])('%s turns on cambodia mode', (url, expected) => {
    expect(checkIsURLCambodia(url)).toBe(expected);
  });

  test.each([
    ['https://nass-123-feature-1.tamanu.io', false],
    ['https://facility-1.release-2-1.internal.tamanu.io/#/', false],
  ])('%s does not turn on cambodia mode', (url, expected) => {
    expect(checkIsURLCambodia(url)).toBe(expected);
  });
});
