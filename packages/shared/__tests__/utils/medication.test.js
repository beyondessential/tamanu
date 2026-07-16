import { set } from 'date-fns';

import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { findAdministrationTimeSlotFromIdealTime } from '../../src/utils/medication';

const breakfastSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(s => s.startTime === '06:00');
const breakfastSlotIndex = MEDICATION_ADMINISTRATION_TIME_SLOTS.indexOf(breakfastSlot);

const morningSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(s => s.startTime === '08:00');
const morningSlotIndex = MEDICATION_ADMINISTRATION_TIME_SLOTS.indexOf(morningSlot);

const nightSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(s => s.startTime === '22:00');
const nightSlotIndex = MEDICATION_ADMINISTRATION_TIME_SLOTS.indexOf(nightSlot);

describe('findAdministrationTimeSlotFromIdealTime', () => {
  describe('breakfast slot (06:00–08:00)', () => {
    it('matches the start of the time slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('06:00');

      expect(result).toEqual({
        index: breakfastSlotIndex,
        timeSlot: breakfastSlot,
        value: '06:00',
      });
    });

    it('matches a time in the middle of the time slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('07:30');

      expect(result).toEqual({
        index: breakfastSlotIndex,
        timeSlot: breakfastSlot,
        value: '07:30',
      });
    });

    it('matches one minute before the end of the time slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('07:59');

      expect(result).toEqual({
        index: breakfastSlotIndex,
        timeSlot: breakfastSlot,
        value: '07:59',
      });
    });
  });

  describe('slot boundaries', () => {
    it('assigns the end of a slot to the next slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('08:00');

      expect(result.index).toBe(morningSlotIndex);
      expect(result.timeSlot).toEqual(morningSlot);
      expect(result.value).toEqual('08:00');
    });

    it('assigns the last minute of the day to the night slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('23:59');

      expect(result.index).toBe(nightSlotIndex);
      expect(result.timeSlot).toEqual(nightSlot);
      expect(result.value).toEqual('23:59');
    });
  });

  describe('Date inputs', () => {
    it('accepts a Date and matches by minute, ignoring seconds', () => {
      const idealTime = set(new Date(), { hours: 7, minutes: 30, seconds: 45 });
      const result = findAdministrationTimeSlotFromIdealTime(idealTime);

      expect(result.index).toBe(breakfastSlotIndex);
      expect(result.timeSlot).toEqual(breakfastSlot);
      expect(result.value).toEqual(idealTime);
    });
  });
});
