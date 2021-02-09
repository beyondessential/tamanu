import React, { useState, useContext, useEffect } from 'react';
import { push } from 'connected-react-router';
import { ApiContext } from '../api/singletons';

const ReferralContext = React.createContext({
  referral: null,
  loadingReferral: false,
  loadReferral: () => {},
  writeReferral: () => {},
});

export const useReferral = () => useContext(ReferralContext);

export const ReferralProvider = ({ store, children }) => {
  const [referral, setReferral] = useState(null);
  const [loadingReferral, setLoadingReferral] = useState(false);

  const api = useContext(ApiContext);

  // write Referral data to the sync server.
  const saveReferral = async (referralId, data) => {
    await api.put(`referral/${referralId}`, data);
  };

  // get Referral data from the sync server and save it to state.
  const loadReferral = async referralId => {
    setLoadingReferral(true);
    const data = await api.get(`referral/${referralId}`);
    setReferral({ ...data });
    setLoadingReferral(false);
    window.referral = referral;
  };

  const writeReferral = async (referralId, data) => {
    console.log("🚀 ~ file: Referral.js ~ line 35 ~ writeReferral ~ data", data)
    await saveReferral(referralId, data);
    await loadReferral(referralId);
  };

  return (
    <ReferralContext.Provider
      value={{
        referral,
        loadingReferral,
        loadReferral,
        writeReferral,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};
