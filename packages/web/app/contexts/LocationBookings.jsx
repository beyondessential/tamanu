import { isSameMonth, isThisMonth, startOfMonth, startOfToday } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  FIRST_DISPLAYED_DAY_ID,
  THIS_WEEK_ID,
} from '../views/scheduling/locationBookings/LocationBookingsCalendarHeader';
import { generateIdFromCell } from '../views/scheduling/locationBookings/utils';
import { LOCATION_BOOKINGS_CALENDAR_ID } from '../views/scheduling/locationBookings/LocationBookingsView';

const LocationBookingsContext = createContext(null);

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
  };

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
