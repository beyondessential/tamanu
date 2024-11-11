import React, { createContext, useContext, useState, useCallback } from 'react';

const LocationBookingContext = createContext();

export const LocationBookingProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    patientNameOrId: '',
    locationGroupIds: [],
    clinicianId: [],
    bookingTypeId: [],
  });

  const handleFilterChange = useCallback(values => {
    setFilters(values);
  }, []);

  return (
    <LocationBookingContext.Provider value={{ filters, handleFilterChange }}>
      {children}
    </LocationBookingContext.Provider>
  );
};

export const useLocationBooking = () => useContext(LocationBookingContext);
