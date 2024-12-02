import React, { createContext, useContext, useState } from 'react';

const OutpatientAppointmentsContext = createContext(null);

export const OutpatientAppointmentsContextProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    appointmentTypeId: [],
    locationGroupId: [],
    patientNameOrId: null,
  });

  return (
    <OutpatientAppointmentsContext.Provider value={{ filters, setFilters }}>
      {children}
    </OutpatientAppointmentsContext.Provider>
  );
};

export const useOutpatientAppointmentsContext = () => {
  const context = useContext(OutpatientAppointmentsContext);
  if (context === null)
    throw new Error(
      'OutpatientAppointmentsContextProvider’s value is null. This probably means useOutpatientAppointmentsContext has been called outside a OutpatientAppointmentsContextProvider.',
    );
  return context;
};
