import { Breadcrumbs, Typography } from '@material-ui/core';
import React from 'react';
import { matchPath, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';
import { PATIENT_CATEGORY_TO_TITLE } from '../constants/patientPaths';
import { usePatientNavigation } from '../utils/usePatientNavigation';

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

const Breadcrumb = ({ onClick, children, path }) => (
  <BreadcrumbLink key={`breadcrumb-${path}`} underline="hover" color="inherit" onClick={onClick}>
    {children}
  </BreadcrumbLink>
);

const getBreadcrumbFromRoute = ({ navigateTo, title, path }) => (
  <Breadcrumb path={path} onClick={navigateTo} key={`breadcrumb-${path}`}>
    {title}
  </Breadcrumb>
);

export const PatientBreadcrumbs = ({ patientRoutes }) => {
  const location = useLocation();
  const { navigateToCategory } = usePatientNavigation();
  const params = useParams();

  const handleCategoryClick = () => navigateToCategory(params.category);

  // Navigates down the patientRoutes tree to get the active route hierarchy
  // and outputs a list of links and titles for these routes.
  const getPatientCrumbs = (routeList, crumbs = []) => {
    if (!routeList) return crumbs;
    for (let i = 0; i < routeList.length; i++) {
      const routeConfig = routeList[i];
      const matched = matchPath(location.pathname, {
        path: routeConfig.path,
      });
      if (matched) {
        return getPatientCrumbs(routeConfig.routes, [
          ...crumbs,
          getBreadcrumbFromRoute(routeConfig),
        ]);
      }
    }
    return crumbs;
  };

  return (
    <StyledBreadcrumbs>
      <Breadcrumb onClick={handleCategoryClick}>
        {PATIENT_CATEGORY_TO_TITLE[params.category]}
      </Breadcrumb>
      {getPatientCrumbs(patientRoutes)}
    </StyledBreadcrumbs>
  );
};
