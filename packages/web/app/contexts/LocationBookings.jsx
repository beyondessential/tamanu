import React, { createContext, useContext, useEffect, useState } from 'react';

const LocationBookingsContext = createContext(null);

import { scrollToCell } from '../views/scheduling/locationBookings/utils';

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

  useEffect(() => {
    if (selectedCell.locationId && selectedCell.date) {
      scrollToCell(selectedCell);
    }
  }, [selectedCell]);

  return (
    <LocationBookingsContext.Provider
      value={{ filters, setFilters, selectedCell, setSelectedCell }}
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
