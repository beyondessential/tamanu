import { Location } from '@tamanu/database';

describe('Location', () => {
  describe('formatFullLocationName', () => {
    it('returns templated area and location when area available', () => {
      const name = Location.formatFullLocationName({
        name: 'test location',
        locationGroup: {
          name: 'test area',
        },
      });
      expect(name).toEqual('test area, test location');
    });
    it('returns name when area not available', () => {
      const name = Location.formatFullLocationName({ name: 'test name' });
      expect(name).toEqual('test name');
    });
  });
});
