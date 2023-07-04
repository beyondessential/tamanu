import React, { useState, useContext } from 'react';
import { useApi } from '../api';

const ReferralContext = React.createContext({
  referral: null,
  isLoadingReferral: false,
  loadReferral: () => {},
  writeReferral: () => {},
});

export const useReferral = () => useContext(ReferralContext);

export const ReferralProvider = ({ children }) => {
  const [referral, setReferral] = useState(null);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);

  const api = useApi();

  // write Referral data to the sync server.
  const saveReferral = async (referralId, data) => {
    await api.put(`referral/${referralId}`, data);
  };

  // get Referral data from the sync server and save it to state.
  const loadReferral = async referralId => {
    setIsLoadingReferral(true);
    const data = await api.get(`referral/${referralId}`);
    setReferral({ ...data });
    setIsLoadingReferral(false);
  };

  const writeReferral = async (referralId, data) => {
    const response = await saveReferral(referralId, data);
    setReferral(response);
  };

  return (
    <ReferralContext.Provider
      value={{
        referral,
        isLoadingReferral,
        loadReferral,
        writeReferral,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};
