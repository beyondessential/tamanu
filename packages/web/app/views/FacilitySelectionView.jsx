import React from 'react';
import { FacilitySelectionForm } from '../forms/FacilitySelectionForm';
import { useAuth } from '../contexts/Auth';

import { AuthFlowView } from './AuthFlowView';

export const FacilitySelectionView = () => {
  const { authError, availableFacilities, selectFacility, logout } = useAuth();

  const handleSubmit = async data => {
    const { facilityId } = data;
    await selectFacility(facilityId);
  };

  return (
    <AuthFlowView data-testid="authflowview-19c1">
      <FacilitySelectionForm
        facilities={availableFacilities}
        onSubmit={handleSubmit}
        onCancel={logout}
        errorMessage={authError}
        data-testid="facilityselectionform-704s"
      />
    </AuthFlowView>
  );
};
