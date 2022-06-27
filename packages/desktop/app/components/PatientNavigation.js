import { push } from 'connected-react-router';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';
import { BackButton } from './Button';
import { PatientBreadcrumbs } from './PatientBreadcrumbs';

const PatientNavigationContainer = styled.div`
  width: 100%;
  background: #ffffff;
  box-shadow: 0px 1px 0px ${Colors.softOutline};
  display: flex;
  height: 50px;
  align-items: center;
  padding-left: 30px;
  padding-right: 30px;
  border-bottom: 1px solid ${Colors.softOutline};
`;

const VerticalDivider = styled.div`
  margin-left: 30px;
  margin-right: 30px;
  border-left: 1px solid ${Colors.softOutline};
  height: 100%;
`;

export const PatientNavigation = () => {
  const params = useParams();
  const dispatch = useDispatch();

  const handleBack = () => {
    if (params.imagingRequestId || params.labRequestId) {
      return dispatch(
        push(`/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}`),
      );
    }
    if (params.encounterId) {
      return dispatch(push(`/patients/${params.category}/${params.patientId}`));
    }
    return dispatch(push(`/patients/${params.category}`));
  };

  return (
    <PatientNavigationContainer>
      <BackButton onClick={handleBack} />
      <VerticalDivider />
      <PatientBreadcrumbs />
    </PatientNavigationContainer>
  );
};
