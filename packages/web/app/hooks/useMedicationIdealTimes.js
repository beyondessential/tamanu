import {
  findAdministrationTimeSlotFromIdealTime,
  getDefaultIdealTimes,
} from '@tamanu/shared/utils/medication';
import { useSettings } from '../contexts/Settings';

export const useMedicationIdealTimes = ({ frequency }) => {
  const { getSetting } = useSettings();
  const configuredAdministrationTimes = getSetting('medications.defaultAdministrationTimes');

  const defaultIdealTimes = getDefaultIdealTimes(frequency, configuredAdministrationTimes);
  const defaultTimeSlots = defaultIdealTimes.map(findAdministrationTimeSlotFromIdealTime);
  return {
    defaultIdealTimes,
    defaultTimeSlots,
  };
};
