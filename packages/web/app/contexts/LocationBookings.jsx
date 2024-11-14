import React, { createContext, useContext, useState } from 'react';

const LocationBookingsContext = createContext(null);

export const LocationBookingsContextProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    patientNameOrId: '',
    locationGroupIds: [],
    clinicianId: [],
    bookingTypeId: [],
  });

  return (
    <LocationBookingsContext.Provider value={{ filters, setFilters }}>
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
