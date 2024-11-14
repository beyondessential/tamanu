import React, { createContext, useContext, useState } from 'react';

const LocationBookingContext = createContext();

export const LocationBookingProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    patientNameOrId: '',
    locationGroupIds: [],
    clinicianId: [],
    bookingTypeId: [],
  });

  return (
    <LocationBookingContext.Provider value={{ filters, setFilters }}>
      {children}
    </LocationBookingContext.Provider>
  );
};

export const useLocationBooking = () => useContext(LocationBookingContext);
