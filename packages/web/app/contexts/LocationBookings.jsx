import { isSameMonth, isThisMonth, parseISO } from 'date-fns';
import React, { createContext, useContext, useState, useEffect } from 'react';

import { VIEW_TYPES } from '@tamanu/constants';
import { useDateTimeFormat } from '@tamanu/ui-components';
import {
  scrollToBeginning,
  scrollToCell,
  scrollToThisWeek,
} from '../views/scheduling/locationBookings/utils';
import { useUserPreferencesQuery } from '../api/queries';
import { useUrlSearchParams } from '../utils/useUrlSearchParams';

const LocationBookingsContext = createContext(null);

export const LOCATION_BOOKINGS_EMPTY_FILTER_STATE = {
  locationGroupIds: [],
  clinicianId: [],
  bookingTypeId: [],
  patientNameOrId: '',
};

export const LocationBookingsContextProvider = ({ children }) => {
  const { getCurrentDate } = useDateTimeFormat();
  const queryParams = useUrlSearchParams();
  const clinicianId = queryParams.get('clinicianId');
  const { data: userPreferences } = useUserPreferencesQuery();
  const [filters, setFilters] = useState({
    LOCATION_BOOKINGS_EMPTY_FILTER_STATE,
  });

  useEffect(() => {
    if (!userPreferences?.locationBookingFilters) return;
    setFilters(userPreferences?.locationBookingFilters);
    if (userPreferences?.locationBookingViewType) {
      setViewType(userPreferences?.locationBookingViewType);
    }
  }, [userPreferences]);

  useEffect(() => {
    if (!clinicianId) return;
    setFilters(filters => ({ ...filters, clinicianId: [clinicianId] }));
  }, [clinicianId]);

  const [selectedCell, setSelectedCell] = useState({
    locationId: null,
    date: null,
  });

  const [monthOf, setMonthOf] = useState(() => parseISO(getCurrentDate()));
  const [viewType, setViewType] = useState(
    userPreferences?.locationBookingViewType || VIEW_TYPES.DAILY,
  );
  const [selectedDate, setSelectedDate] = useState(() => parseISO(getCurrentDate()));
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
        viewType,
        setViewType,
        selectedDate,
        setSelectedDate,
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
