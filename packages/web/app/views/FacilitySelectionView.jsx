import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FacilitySelectionForm } from '../forms/FacilitySelectionForm';
import { logout, setFacilityId } from '../store';

import { AuthFlowView } from './AuthFlowView';

export const FacilitySelectionView = () => {
  const dispatch = useDispatch();
  const error = useSelector(state => state.auth.error);
  const facilities = useSelector(state => state.auth.availableFacilities);

  const handleSubmit = async data => {
    const { facilityId } = data;
    await dispatch(setFacilityId(facilityId));
  };

  const handleCancel = async () => {
    await dispatch(logout());
  };

  return (
    <AuthFlowView data-testid='authflowview-19c1'>
      <FacilitySelectionForm
        facilities={facilities}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        errorMessage={error}
        data-testid='facilityselectionform-704s' />
    </AuthFlowView>
  );
};
