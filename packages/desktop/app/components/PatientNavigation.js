import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { BackButton } from './Button';
import { PatientBreadcrumbs } from './PatientBreadcrumbs';

const PatientNavigationContainer = styled.div`
  width: 100%;
  background: #ffffff;
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

export const PatientNavigation = ({ patientRoutes }) => {
  const { navigateBack } = usePatientNavigation();
  return (
    <PatientNavigationContainer>
      <BackButton onClick={navigateBack} />
      <VerticalDivider />
      <PatientBreadcrumbs patientRoutes={patientRoutes} />
    </PatientNavigationContainer>
  );
};
