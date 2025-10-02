import { Breadcrumbs, Typography } from '@material-ui/core';
import React from 'react';
import { useMatch, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';
import { PATIENT_CATEGORY_LABELS } from '../constants/patientPaths';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';
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
  <BreadcrumbLink
    key={`breadcrumb-${path}`}
    underline="hover"
    color="inherit"
    onClick={onClick}
    data-testid="breadcrumblink-gv2r"
  >
    {children}
  </BreadcrumbLink>
);

const getBreadcrumbFromRoute = ({ navigateTo, title, path }) => (
  <Breadcrumb
    path={path || 'index'}
    onClick={navigateTo}
    key={`breadcrumb-${path || 'index'}`}
    data-testid="breadcrumb-strg"
  >
    {title}
  </Breadcrumb>
);

// Utility: count path segments for ordering (index => 0)
const getDepth = (path) => {
  if (!path) return 0;
  return path.split('/').filter(Boolean).length;
};

export const PatientBreadcrumbs = ({ patientRoutes }) => {
  const { navigateToCategory } = usePatientNavigation();
  const params = useParams();

  const handleCategoryClick = () => navigateToCategory(params.category);

  // Compute breadcrumbs from a flat list using relative matching in the current route context
  // Use useMatch for each route (stable list) to determine if it contributes to the current path
  const matches = patientRoutes.map(route => ({
    route,
    match: route.index ? useMatch('') : useMatch({ path: route.path, end: false }),
  }));

  // Keep matched routes only and sort by depth so parents come before children
  const matchedRoutes = matches
    .filter(m => !!m.match)
    .sort((a, b) => getDepth(a.route.path) - getDepth(b.route.path))
    .map(m => m.route);

  // Build crumbs: include any subPaths for the most specific matched route before its own crumb
  const crumbs = [];
  matchedRoutes.forEach((route, idx) => {
    if (idx === matchedRoutes.length - 1 && route?.subPaths?.length) {
      route.subPaths.forEach(sub => crumbs.push(getBreadcrumbFromRoute(sub)));
    }
    crumbs.push(getBreadcrumbFromRoute(route));
  });

  return (
    <StyledBreadcrumbs data-testid="styledbreadcrumbs-68ga">
      <NoteModalActionBlocker isNavigationBlock>
        <Breadcrumb onClick={handleCategoryClick} data-testid="breadcrumb-0r0o">
          {PATIENT_CATEGORY_LABELS[params.category]}
        </Breadcrumb>
      </NoteModalActionBlocker>
      {crumbs}
    </StyledBreadcrumbs>
  );
};
