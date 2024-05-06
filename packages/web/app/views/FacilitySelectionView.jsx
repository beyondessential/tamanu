import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FacilitySelectionForm } from '../forms/FacilitySelectionForm';
import { setFacilityId } from '../store';

import { AuthFlowView } from './AuthFlowView';

export const FacilitySelectionView = () => {
  const dispatch = useDispatch();
  const error = useSelector(state => state.auth.error);
  const facilities = useSelector(state => state.auth.facilities);

  const handleSubmit = async data => {
    const { facilityId } = data;
    await dispatch(setFacilityId(facilityId));
  };

  return (
    <AuthFlowView>
      <FacilitySelectionForm facilities={facilities} onSubmit={handleSubmit} errorMessage={error} />
    </AuthFlowView>
  );
};
