import { useSettings } from '../contexts/Settings';

export const useBookingSlotSettings = () => {
  const { getSetting } = useSettings();
  return getSetting('appointments.bookingSlots');
};
