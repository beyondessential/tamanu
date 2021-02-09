import React, { useState, useContext, useEffect } from 'react';
import { push } from 'connected-react-router';
import { ApiContext } from '../api/singletons';

const ReferralContext = React.createContext({
  referral: null,
});

export const useEncounter = () => useContext(ReferralContext);

export const EncounterProvider = ({ store, children }) => {
  const [referral, setReferral] = useState(null);

  useEffect(() => {
    window.referral = referral;
  }, [referral]);

  return (
    <ReferralContext.Provider
      value={{
        referral,
        setReferral,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};
