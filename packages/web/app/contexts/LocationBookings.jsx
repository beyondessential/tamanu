import { isThisMonth, startOfToday } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { generateIdFromCell } from '../views/scheduling/locationBookings/utils';
import {
  firstDisplayedDayId,
  thisWeekId,
} from '../views/scheduling/locationBookings/LocationBookingsCalendarHeader';

const LocationBookingsContext = createContext(null);

const scrollToThisWeek = () =>
  document.getElementById(thisWeekId)?.scrollIntoView({ inline: 'start' });
const scrollToBeginning = () =>
  document.getElementById(firstDisplayedDayId)?.scrollIntoView({ inline: 'start' });
 const scrollToCell = cell => {
  document.getElementById(generateIdFromCell(cell))?.scrollIntoView({ inline: 'start' });
};

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

  const updateSelectedCell = newCellData => {
    setSelectedCell(prevCell => {
      const updatedCell = { ...prevCell, ...newCellData };
      if (updatedCell.locationId && updatedCell.date) {
        setMonthOf(updatedCell.date);
      }
      return updatedCell;
    });
  };

  const updateMonth = date => {
    setMonthOf(date);
    (isThisMonth(date) ? scrollToThisWeek : scrollToBeginning)();
  };

  useEffect(() => scrollToCell(selectedCell), [selectedCell]);

  return (
    <LocationBookingsContext.Provider
      value={{
        filters,
        setFilters,
        selectedCell,
        updateSelectedCell,
        monthOf,
        updateMonth,
      }}
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
