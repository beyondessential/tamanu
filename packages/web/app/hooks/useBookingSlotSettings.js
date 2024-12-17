import { useSettings } from '../contexts/Settings';

export const useBookingSlotSettings = () => useSettings().getSetting('appointments.bookingSlots');
