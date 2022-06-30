import { Breadcrumbs, Typography } from '@material-ui/core';
import React from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';

const StyledBreadcrumbs = styled(Breadcrumbs)`
  & ol > .MuiBreadcrumbs-separator {
    font-size: 12px;
    color: ${Colors.softText};
  }
`;

const BreadcrumbText = styled(Typography)`
  font-size: 12px;
  color: ${props => props.theme.palette.primary.main};
  text-transform: capitalize;
  font-weight: 500;
  cursor: default;
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

const Breadcrumb = ({ active, ...props }) =>
  active ? <ActiveBreadcrumb {...props} /> : <InactiveBreadcrumb {...props} />;

const ActiveBreadcrumb = ({ children }) => <BreadcrumbText>{children}</BreadcrumbText>;
const InactiveBreadcrumb = ({ children, onClick }) => (
  <BreadcrumbLink underline="hover" color="inherit" onClick={onClick}>
    {children}
  </BreadcrumbLink>
);

const getBreadcrumbFromRoute = (route, isExact) => (
  <Breadcrumb onClick={() => route.navigateTo()} active={isExact}>
    {route.title}
  </Breadcrumb>
);

export const PatientBreadcrumbs = ({ routeMap }) => {
  const location = useLocation();

  const getCrumbs = (routeList, crumbs = []) => {
    if (!routeList) return crumbs;
    for (let i = 0; i < routeList.length; i++) {
      const routeConfig = routeList[i];
      const matched = matchPath(location.pathname, {
        path: routeConfig.path,
      });
      if (matched) {
        return getCrumbs(routeConfig.routes, [
          ...crumbs,
          getBreadcrumbFromRoute(routeConfig, matched.isExact),
        ]);
      }
    }
    return crumbs;
  };

  return <StyledBreadcrumbs>{getCrumbs(routeMap)}</StyledBreadcrumbs>;
};
