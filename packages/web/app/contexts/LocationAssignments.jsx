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
  useEffect(
    () => {
      if (isSameMonth(selectedCell.date, monthOf)) {
        scrollToCell(selectedCell, { behavior: 'instant' });
      } else {
        (isThisMonth(monthOf) ? scrollToThisWeek : scrollToFirstDisplayedDay)({ behavior: 'instant' });
      }
    },
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
