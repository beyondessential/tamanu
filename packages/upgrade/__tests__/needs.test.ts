import { expect, it } from 'vitest';
import { needsStep, STEP_PREFIX, needsMigration, MIGRATION_PREFIX } from '../src/step.js';

it('needsStep normal usage', async () => {
  expect(needsStep('1749079898013-initDeviceKey/0')).toBe(
    `${STEP_PREFIX}1749079898013-initDeviceKey/0`,
  );
});

it('needsStep strips extension', async () => {
  expect(needsStep('1749079898013-initDeviceKey.ts/0')).toBe(
    `${STEP_PREFIX}1749079898013-initDeviceKey/0`,
  );
});

it('needsStep strips prefix', async () => {
  expect(needsStep('steps/1749079898013-initDeviceKey/0')).toBe(
    `${STEP_PREFIX}1749079898013-initDeviceKey/0`,
  );
});

it('needsStep throws when index is missing', async () => {
  expect(() => needsStep('1749079898013-initDeviceKey')).toThrow(
    'You must provide an index when depending on upgrade steps',
  );
});

it('needsStep throws when nothing is passed in', async () => {
  expect(() => needsStep('')).toThrow('Invalid step name');
});

it('needsMigration normal usage', async () => {
  expect(needsMigration('1739968205100-addLSFFunction')).toBe(
    `${MIGRATION_PREFIX}1739968205100-addLSFFunction`,
  );
});

it('needsMigration strips extension', async () => {
  expect(needsMigration('1739968205100-addLSFFunction.js')).toBe(
    `${MIGRATION_PREFIX}1739968205100-addLSFFunction`,
  );
});

it('needsMigration strips prefix', async () => {
  expect(needsMigration('steps/1739968205100-addLSFFunction')).toBe(
    `${MIGRATION_PREFIX}1739968205100-addLSFFunction`,
  );
});
