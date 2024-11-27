import { parseISO } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';

const LocationBookingsContext = createContext(null);

const generateIdFromCell = cell => `${cell.locationId}.${parseISO(cell.date).valueOf()}`;

export const scrollToCell = newCell => {
  document
    .getElementById(generateIdFromCell(newCell))
    ?.scrollIntoView({ inline: 'start', block: 'center', behavior: 'smooth' });
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
