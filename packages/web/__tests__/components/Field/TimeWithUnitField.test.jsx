/*
 * Regression test for TimeWithUnitInput.
 *
 * TIME_UNIT_OPTIONS is a shared array imported from @tamanu/constants. The component used to
 * call TIME_UNIT_OPTIONS.sort(...) directly, mutating the shared array in place (descending in
 * the mount effect, ascending in render) instead of sorting a copy. Because the default unit is
 * read from TIME_UNIT_OPTIONS[0], once a valued instance had mounted and left the shared array
 * mutated, a later empty instance could default to the wrong unit instead of minutes.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TIME_UNIT_OPTIONS } from '@tamanu/constants';
import { SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';
import { TimeWithUnitInput } from '../../../app/components/Field/TimeWithUnitField';

const renderTimeWithUnitInput = (props) =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => false }}>
      <TimeWithUnitInput onChange={() => {}} {...props} />
    </SettingsContext.Provider>,
  );

describe('TimeWithUnitInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not mutate the shared TIME_UNIT_OPTIONS array when mounting with a value', () => {
    const originalOrder = TIME_UNIT_OPTIONS.map((option) => option.unit);
    const sortSpy = vi.spyOn(Array.prototype, 'sort');

    renderTimeWithUnitInput({
      name: 'timeToDeath',
      value: 60 * 24 * 365 * 2,
      label: 'Time',
    });

    // Sorting is fine as long as it's never done directly on the shared constant.
    const sortedTheSharedArrayInPlace = sortSpy.mock.instances.some(
      (instance) => instance === TIME_UNIT_OPTIONS,
    );
    expect(sortedTheSharedArrayInPlace).toBe(false);
    expect(TIME_UNIT_OPTIONS.map((option) => option.unit)).toEqual(originalOrder);
  });

  it('renders the unit options select without mutating the shared TIME_UNIT_OPTIONS array', () => {
    const originalOrder = TIME_UNIT_OPTIONS.map((option) => option.unit);
    const sortSpy = vi.spyOn(Array.prototype, 'sort');

    renderTimeWithUnitInput({
      name: 'timeBetweenOnsetAndDeath',
      value: 0,
      label: 'Time empty',
    });

    const sortedTheSharedArrayInPlace = sortSpy.mock.instances.some(
      (instance) => instance === TIME_UNIT_OPTIONS,
    );
    expect(sortedTheSharedArrayInPlace).toBe(false);
    expect(TIME_UNIT_OPTIONS.map((option) => option.unit)).toEqual(originalOrder);
  });
});
