import React, { createContext, useContext, useEffect, useState } from 'react';
import { isThisMonth, startOfToday } from 'date-fns';

import { scrollToCell } from '../views/scheduling/locationBookings/utils';
import { firstDisplayedDayId, thisWeekId } from '../views/scheduling/locationBookings/LocationBookingsCalendarHeader';

const LocationBookingsContext = createContext(null);

const scrollToThisWeek = () =>
  document.getElementById(thisWeekId)?.scrollIntoView({ inline: 'start' });
const scrollToBeginning = () =>
  document.getElementById(firstDisplayedDayId)?.scrollIntoView({ inline: 'start' });

export const LocationBookingsContextProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    patientNameOrId: '',
    locationGroupIds: [],
    clinicianId: [],
    bookingTypeId: [],
  });

  const [selectedCell, setSelectedCell] = useState({
    locationId: null,
    date: null,
  });

  const [monthOf, setMonthOf] = useState(startOfToday());

  // Calendar Scroll logic
  useEffect(() => {
    if (selectedCell.locationId && selectedCell.date) {
      scrollToCell(selectedCell);
      return;
    }
    (isThisMonth(monthOf) ? scrollToThisWeek : scrollToBeginning)();
  }, [selectedCell, monthOf]);


  return (
    <LocationBookingsContext.Provider
      value={{ filters, setFilters, selectedCell, setSelectedCell, monthOf, setMonthOf }}
    >
      {children}
    </LocationBookingsContext.Provider>
  );
};

export const useLocationBookingsContext = () => {
  const context = useContext(LocationBookingsContext);
  if (!context)
    throw new Error(
      'useLocationBookingsContext has been called outside a LocationBookingsContextProvider',
    );
  return context;
};
