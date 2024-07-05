import { isRegisteredEnum } from '../src/enumRegistry';
import { APPOINTMENT_STATUSES } from '../src/statuses';

describe('enumRegistry', () => {
  it('returns true for registered enum', () => {
    expect(isRegisteredEnum(APPOINTMENT_STATUSES)).toBe(true);
  });
  it('returns false for unregistered enum', () => {
    expect(isRegisteredEnum({ dog: 'woof' })).toBe(false);
  });
});
