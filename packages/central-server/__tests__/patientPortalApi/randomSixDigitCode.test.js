import { randomSixDigitCode } from '../../app/patientPortalApi/auth/PortalOneTimeTokenService';

describe('randomSixDigitCode', () => {
  it('generates six-digit codes that use the full 0-9 digit range', () => {
    const sampleSize = 2000;
    const codes = Array.from({ length: sampleSize }, () => randomSixDigitCode());

    for (const code of codes) {
      expect(code).toMatch(/^[0-9]{6}$/);
    }

    const digitsSeen = new Set(codes.join(''));
    expect(digitsSeen.has('9')).toBe(true);
  });
});
