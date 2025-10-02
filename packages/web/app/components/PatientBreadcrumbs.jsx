import React from 'react';
import { Breadcrumbs, Typography } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { matchPath, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';
import { PATIENT_CATEGORY_LABELS } from '../constants/patientPaths';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';
import { getPatientNameAsString } from './PatientNameDisplay';

const StyledBreadcrumbs = styled(Breadcrumbs)`
  & ol > .MuiBreadcrumbs-separator {
    font-size: 12px;
    color: ${Colors.softText};
  }
  & ol > :last-child > p {
    pointer-events: none;
    font-weight: 500;
    cursor: default;
  }
`;

const BreadcrumbLink = styled(Typography)`
  font-size: 12px;
  color: ${props => props.theme.palette.primary.main};
  font-weight: 400;
  text-transform: capitalize;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export const Breadcrumb = ({ onClick, title }) => (
  <BreadcrumbLink underline="hover" color="inherit" onClick={onClick}>
    {title}
  </BreadcrumbLink>
);

const PatientBreadcrumb = () => {
  const patient = useSelector(state => state.patient);
  const { navigateToPatient } = usePatientNavigation();
  const onClick = () => navigateToPatient(patient.id);
  return <Breadcrumb onClick={onClick} title={getPatientNameAsString(patient || {})} />;
};

const CategoryBreadcrumb = () => {
  const { navigateToCategory } = usePatientNavigation();
  const params = useParams();
  const onClick = () => navigateToCategory(params.category);
  return <Breadcrumb onClick={onClick} title={PATIENT_CATEGORY_LABELS[params.category]} />;
};

const RouteBreadcrumbs = ({ patientRoutes }) => {
  const location = useLocation();
  const params = useParams();

  // Find the matching route based on current location
  const matchedRoute = patientRoutes.find(route => {
    if (route.index) {
      return null;
    }

    const fullPath = `/patients/${params.category}/${params.patientId}/${route.path}`;
    return matchPath({ path: fullPath, exact: false }, location.pathname);
  });

  return matchedRoute?.breadcrumbs ? matchedRoute.breadcrumbs : null;
};

export const PatientBreadcrumbs = ({ patientRoutes }) => {
  return (
    <NoteModalActionBlocker isNavigationBlock>
      <StyledBreadcrumbs data-testid="styledbreadcrumbs-68ga">
        <CategoryBreadcrumb />
        <PatientBreadcrumb />
        <RouteBreadcrumbs patientRoutes={patientRoutes} />
      </StyledBreadcrumbs>
    </NoteModalActionBlocker>
  );
};
