import React, { createContext, useContext, useState, useCallback } from 'react';

const LocationBookingFiltersContext = createContext();

export const LocationBookingFiltersProvider = ({ children }) => {
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
    <LocationBookingFiltersContext.Provider value={{ filters, handleFilterChange }}>
      {children}
    </LocationBookingFiltersContext.Provider>
  );
};

export const useLocationBookingFilters = () => useContext(LocationBookingFiltersContext);
