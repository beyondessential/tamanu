import { isSameMonth, isThisMonth, startOfToday } from 'date-fns';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  scrollToBeginning,
  scrollToCell,
  scrollToThisWeek,
} from '../views/scheduling/locationBookings/utils';
import { useUserPreferencesQuery } from '../api/queries';

const LocationBookingsContext = createContext(null);

export const LocationBookingsContextProvider = ({ children }) => {
  const { data: userPreferences } = useUserPreferencesQuery();
  const [filters, setFilters] = useState({
    patientNameOrId: '',
    locationGroupIds: [],
    clinicianId: [],
    bookingTypeId: [],
  });

  useEffect(() => {
    if (userPreferences?.locationBookingFilters) {
      setFilters(userPreferences?.locationBookingFilters);
    }
  }, [userPreferences]);

  const [selectedCell, setSelectedCell] = useState({
    locationId: null,
    date: null,
  });

  const [monthOf, setMonthOf] = useState(startOfToday());
  useEffect(
    () => {
      if (isSameMonth(selectedCell.date, monthOf)) {
        scrollToCell(selectedCell, { behavior: 'instant' });
      } else {
        (isThisMonth(monthOf) ? scrollToThisWeek : scrollToBeginning)({ behavior: 'instant' });
      }
    },
    // If selected cell changes within a given month, autoscroll is handled imperatively by
    // `updateSelectedCell`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthOf],
  );

  const updateSelectedCell = newCellData => {
    setSelectedCell(prevCell => {
      const updatedCell = { ...prevCell, ...newCellData };

      const { date, locationId } = updatedCell;
      if (locationId && date)
        if (isSameMonth(date, monthOf)) {
          scrollToCell(updatedCell);
        } else {
          setMonthOf(date);
          // Rely on useEffect to autoscroll to correct place after browser repaint
        }

      return updatedCell;
    });
  };

  return (
    <LocationBookingsContext.Provider
      value={{
        filters,
        setFilters,
        selectedCell,
        updateSelectedCell,
        monthOf,
        setMonthOf,
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
