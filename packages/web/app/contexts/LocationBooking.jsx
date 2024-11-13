import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUserPreferencesMutation } from '../api/mutations/useUserPreferencesMutation';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';

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
