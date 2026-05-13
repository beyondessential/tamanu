import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  addField,
  applyChain,
  applyChainToBatch,
  clearRegisteredShimsForTesting,
  registerWireShim,
  removeField,
  renameField,
} from '../../src/sync/wireShims';

describe('wireShims', () => {
  // The default registry is populated at import time. Tests in this file want to
  // exercise their own shim chains, so we wipe and re-register inside each test
  // and put the production registry back afterwards.
  beforeEach(() => clearRegisteredShimsForTesting());
  afterEach(() => clearRegisteredShimsForTesting());

  describe('applyChain', () => {
    it('is a no-op when fromVersion === toVersion', () => {
      const record = { id: '1', name: 'thing' };
      expect(applyChain('patient_death_data', record, 1, 1)).toBe(record);
    });

    it('walks shims forward when upcasting (fromVersion < toVersion)', () => {
      registerWireShim({
        recordType: 'thing',
        versionFrom: 0,
        ...addField('newField', 'default'),
      });
      const upcasted = applyChain('thing', { id: '1' }, 0, 1);
      expect(upcasted).toEqual({ id: '1', newField: 'default' });
    });

    it('walks shims backward when downcasting (fromVersion > toVersion)', () => {
      registerWireShim({
        recordType: 'thing',
        versionFrom: 0,
        ...addField('newField', 'default'),
      });
      const downcasted = applyChain('thing', { id: '1', newField: 'value' }, 1, 0);
      expect(downcasted).toEqual({ id: '1' });
    });

    it('ignores shims for other record types', () => {
      registerWireShim({
        recordType: 'thing',
        versionFrom: 0,
        ...addField('newField', 'default'),
      });
      // unrelated recordType: chain should leave the record alone
      const result = applyChain('other_thing', { id: '1' }, 0, 1);
      expect(result).toEqual({ id: '1' });
    });

    it('chains multiple bumps in order', () => {
      registerWireShim({
        recordType: 'thing',
        versionFrom: 0,
        ...addField('a', 1),
      });
      registerWireShim({
        recordType: 'thing',
        versionFrom: 1,
        ...addField('b', 2),
      });
      const upcasted = applyChain('thing', { id: '1' }, 0, 2);
      expect(upcasted).toEqual({ id: '1', a: 1, b: 2 });

      const downcasted = applyChain('thing', { id: '1', a: 1, b: 2 }, 2, 0);
      expect(downcasted).toEqual({ id: '1' });
    });

    it('round-trips upcast → downcast for added fields', () => {
      registerWireShim({
        recordType: 'thing',
        versionFrom: 0,
        ...addField('extra', null),
      });
      const original = { id: '1', name: 'a' };
      const round = applyChain('thing', applyChain('thing', original, 0, 1), 1, 0);
      expect(round).toEqual(original);
    });
  });

  describe('applyChainToBatch', () => {
    it('applies the chain to each record by its recordType', () => {
      registerWireShim({
        recordType: 'thing',
        versionFrom: 0,
        ...addField('extra', null),
      });
      const result = applyChainToBatch(
        [
          { recordType: 'thing', data: { id: '1' } },
          { recordType: 'other', data: { id: '2' } },
        ],
        0,
        1,
      );
      expect(result).toEqual([
        { recordType: 'thing', data: { id: '1', extra: null } },
        { recordType: 'other', data: { id: '2' } },
      ]);
    });

    it('returns the same array when fromVersion === toVersion', () => {
      const batch = [{ recordType: 'thing', data: { id: '1' } }];
      expect(applyChainToBatch(batch, 1, 1)).toBe(batch);
    });
  });

  describe('combinators', () => {
    it('addField fills default on upcast and drops on downcast', () => {
      const shim = addField('x', 'default');
      expect(shim.upcast!({ id: '1' })).toEqual({ id: '1', x: 'default' });
      expect(shim.upcast!({ id: '1', x: 'present' })).toEqual({ id: '1', x: 'present' });
      expect(shim.downcast!({ id: '1', x: 'value' })).toEqual({ id: '1' });
    });

    it('removeField is the inverse of addField', () => {
      const shim = removeField('x', 'default');
      expect(shim.downcast!({ id: '1' })).toEqual({ id: '1', x: 'default' });
      expect(shim.upcast!({ id: '1', x: 'value' })).toEqual({ id: '1' });
    });

    it('renameField swaps key names in both directions', () => {
      const shim = renameField('oldName', 'newName');
      expect(shim.upcast!({ id: '1', oldName: 'v' })).toEqual({ id: '1', newName: 'v' });
      expect(shim.downcast!({ id: '1', newName: 'v' })).toEqual({ id: '1', oldName: 'v' });
      expect(shim.upcast!({ id: '1' })).toEqual({ id: '1' });
      expect(shim.downcast!({ id: '1' })).toEqual({ id: '1' });
    });
  });

});
