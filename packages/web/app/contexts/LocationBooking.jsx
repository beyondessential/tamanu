import React, { createContext, useContext, useState, useCallback } from 'react';

const LocationBookingContext = createContext();

export const LocationBookingProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    patientNameOrId: '',
    locationGroupIds: [],
    clinicianId: [],
    bookingTypeId: [],
  });

  const [selectedCell, setSelectedCell] = useState({ date: null, locationId: null });

  const updateSelectedLocation = locationId => {
    setSelectedCell(prev => ({ ...prev, locationId }));
  };
  const updateSelectedDate = date => {
    setSelectedCell(prev => ({ ...prev, date }));
  };

  const clearSelectedCell = () => setSelectedCell({ date: null, locationId: null });

  const handleFilterChange = useCallback(values => {
    setFilters(values);
  }, []);

  return (
    <LocationBookingContext.Provider
      value={{
        filters,
        handleFilterChange,
        selectedCell,
        updateSelectedLocation,
        updateSelectedDate,
        clearSelectedCell,
      }}
    >
      {children}
    </LocationBookingContext.Provider>
  );
};

export const useLocationBooking = () => useContext(LocationBookingContext);
