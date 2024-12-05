import { isThisMonth, startOfToday } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { generateIdFromCell } from '../views/scheduling/locationBookings/utils';
import {
  FIRST_DISPLAYED_DAY_ID,
  THIS_WEEK_ID,
} from '../views/scheduling/locationBookings/LocationBookingsCalendarHeader';

const LocationBookingsContext = createContext(null);

const scrollToThisWeek = () =>
  document.getElementById(THIS_WEEK_ID)?.scrollIntoView({ inline: 'start' });
const scrollToBeginning = () =>
  document.getElementById(FIRST_DISPLAYED_DAY_ID)?.scrollIntoView({ inline: 'start' });
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
    setMonthOf(startOfMonth(date));
    (isThisMonth(date) ? scrollToThisWeek : scrollToBeginning)();
  };

  useEffect(
    () => {
      const { date, locationId } = selectedCell;
      if (date && locationId && isSameMonth(date, monthOf)) {
        scrollToCell(selectedCell);
        return;
      }

      (isThisMonth(monthOf) ? scrollToThisWeek : scrollToBeginning)();
    },
    // Don’t fire this useEffect when the month changes while a cell happens to be selected
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCell],
  );

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
