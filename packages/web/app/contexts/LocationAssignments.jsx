import { isSameMonth, isThisMonth, startOfToday } from 'date-fns';
import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  scrollToCell,
  scrollToFirstDisplayedDay,
  scrollToThisWeek,
} from '../views/administration/locationAssignments/utils';

const LocationAssignmentsContext = createContext(null);

export const LocationAssignmentsContextProvider = ({ children }) => {
  const [selectedCell, setSelectedCell] = useState({
    locationId: null,
    date: null,
  });

  const [monthOf, setMonthOf] = useState(startOfToday());
  const [isCalendarLoaded, setIsCalendarLoaded] = useState(false);

  useEffect(
    () => {
      if (!isCalendarLoaded) return;
      if (isSameMonth(selectedCell.date, monthOf)) {
        scrollToCell(selectedCell, { behavior: 'instant' });
      } else {
        (isThisMonth(monthOf) ? scrollToThisWeek : scrollToFirstDisplayedDay)({ behavior: 'instant' });
      }
    },
    [monthOf, isCalendarLoaded],
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
        }

      return updatedCell;
    });
  };

  return (
    <LocationAssignmentsContext.Provider
      value={{
        selectedCell,
        updateSelectedCell,
        monthOf,
        setMonthOf,
        isCalendarLoaded,
        setIsCalendarLoaded,
      }}
    >
      {children}
    </LocationAssignmentsContext.Provider>
  );
};

export const useLocationAssignmentsContext = () => {
  const context = useContext(LocationAssignmentsContext);
  if (!context)
    throw new Error(
      'useLocationAssignmentsContext has been called outside a LocationAssignmentsContextProvider',
    );
  return context;
};
