import { Location } from '@tamanu/shared/models/Location';

describe('Location', () => {
  describe('parseFullLocationName', () => {
    it('returns area and location from comma separated content', () => {
      const { group, location } = Location.parseFullLocationName('test area, test location');
      expect(group).toEqual('test area');
      expect(location).toEqual('test location');
    });
    it('returns area and location from comma separated content when comma in location', () => {
      const { group, location } = Location.parseFullLocationName(
        'test area, test location, extra comma',
      );
      expect(group).toEqual('test area');
      expect(location).toEqual('test location, extra comma');
    });
    it('returns location as full content when no comma separated content', () => {
      const { group, location } = Location.parseFullLocationName('test location');
      expect(location).toEqual('test location');
      expect(group).toBeUndefined();
    });
  });
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
