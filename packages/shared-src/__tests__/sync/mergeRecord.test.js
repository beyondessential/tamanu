import { mergeRecord } from '../../src/sync/mergeRecord';

const EXISTING = {
  id: 'xxx',
  foreignId: 'yyy',
  number: 4,
  empty: null,
};
const INCOMING = {
  id: 'xxx',
  foreignId: 'zzz',
  number: 6,
  empty: 'full',
  updatedAtSyncTick: 1,
};

describe('mergeRecord', () => {
  describe('lastSyncWinsPerRecord', () => {
    it('uses the entire incoming record whenever per field information is not available, ignoring the fact the existing record has the higher sync tick', () => {
      const existing = { ...EXISTING, updatedAtSyncTick: 3 };
      const incoming = { ...INCOMING, updatedAtSyncTick: 2 };
      const merged = mergeRecord(existing, incoming);
      expect(merged).toEqual(incoming);
    });
    it('uses the entire incoming record whenever per field information is not available, including when it has the higher sync tick', () => {
      const existing = { ...EXISTING, updatedAtSyncTick: 3 };
      const incoming = { ...INCOMING, updatedAtSyncTick: 5 };
      const merged = mergeRecord(existing, incoming);
      expect(merged).toEqual(incoming);
    });
    it('still uses the entire incoming record if only the existing record has field update information', () => {
      const existing = {
        ...EXISTING,
        updatedAtSyncTick: 3,
        updatedAtByField: { id: 1, foreign_id: 3, number: 2 },
      };
      const incoming = {
        ...INCOMING,
        updatedAtSyncTick: 5,
      };
      const merged = mergeRecord(existing, incoming);
      expect(merged).toEqual(incoming);
    });

    it('still uses the entire incoming record if only the incoming record has field update information', () => {
      const existing = {
        ...EXISTING,
        updatedAtSyncTick: 3,
      };
      const incoming = {
        ...INCOMING,
        updatedAtSyncTick: 5,
        updatedAtByField: { id: 1, foreign_id: 5, number: 5, empty: 2 },
      };
      const merged = mergeRecord(existing, incoming);
      expect(merged).toEqual(incoming);
    });
  });

  describe('lastWriteWinsPerField', () => {
    it('picks the latest version of each field when field information is available', () => {
      const existing = {
        ...EXISTING,
        updatedAtSyncTick: 3,
        updatedAtByField: { id: 1, foreign_id: 3, number: 3 },
      };
      const incoming = {
        ...INCOMING,
        updatedAtSyncTick: 5,
        updatedAtByField: { id: 1, foreign_id: 5, number: 2, empty: 2 },
      };
      const merged = mergeRecord(existing, incoming);
      expect(merged).toEqual({
        id: existing.id,
        foreignId: incoming.foreignId,
        number: existing.number,
        empty: incoming.empty,
        updatedAtSyncTick: 5,
        updatedAtByField: { id: 1, foreign_id: 5, number: 3, empty: 2 },
      });
    });
  });
});
