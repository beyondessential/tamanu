import { findAdministrationTimeSlotFromIdealTime } from '@tamanu/shared/utils/medication';
import { useSettings } from '../contexts/Settings';

export const useMedicationIdealTimes = ({ frequency }) => {
  const { getSetting } = useSettings();
  const frequenciesAdministrationIdealTimes = getSetting('medications.defaultAdministrationTimes');

  const defaultIdealTimes = frequenciesAdministrationIdealTimes?.[frequency];
  const defaultTimeSlots = defaultIdealTimes?.map(findAdministrationTimeSlotFromIdealTime);
  return {
    defaultTimeSlots,
  };
};
