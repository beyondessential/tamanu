import { isSameMonth, isThisMonth, startOfToday } from 'date-fns';
import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  scrollToBeginning,
  scrollToCell,
  scrollToThisWeek,
} from '../views/scheduling/locationBookings/utils';
import { useUserPreferencesQuery } from '../api/queries';
import { useUrlSearchParams } from '../utils/useUrlSearchParams';

const LocationAssignmentsContext = createContext(null);

export const LOCATION_ASSIGNMENTS_EMPTY_FILTER_STATE = {
  locationGroupIds: [],
  userId: [],
};

export const LocationAssignmentsContextProvider = ({ children }) => {
  const queryParams = useUrlSearchParams();
  const userId = queryParams.get('userId');
  const { data: userPreferences } = useUserPreferencesQuery();
  const [filters, setFilters] = useState(LOCATION_ASSIGNMENTS_EMPTY_FILTER_STATE);

  useEffect(() => {
    if (!userPreferences?.locationAssignmentFilters) return;
    setFilters(userPreferences?.locationAssignmentFilters);
  }, [userPreferences]);

  useEffect(() => {
    if (!userId) return;
    setFilters((filters) => ({ ...filters, userId: [userId] }));
  }, [userId]);

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

  const updateSelectedCell = (newCellData) => {
    setSelectedCell((prevCell) => {
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
    <LocationAssignmentsContext.Provider
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