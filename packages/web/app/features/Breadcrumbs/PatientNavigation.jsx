import React from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';
import { Breadcrumbs } from '@material-ui/core';
import { Colors } from '../../constants';
import { BackButton, NoteModalActionBlocker } from '../../components';
import { PatientBreadcrumb, CategoryBreadcrumb } from './PatientBreadcrumbs';
import { PATIENT_PATHS } from '../../constants/patientPaths';

export const NAVIGATION_CONTAINER_HEIGHT = '50px';

const StickyContainer = styled.div`
  width: 100%;
  background: ${Colors.white};
  display: flex;
  z-index: 9;
  position: sticky;
  top: 0;
  height: ${NAVIGATION_CONTAINER_HEIGHT};
  align-items: center;
  padding-left: 30px;
  padding-right: 30px;
  border-bottom: 1px solid ${Colors.softOutline};
  flex-shrink: 0;
`;

const VerticalDivider = styled.div`
  margin-left: 30px;
  margin-right: 30px;
  border-left: 1px solid ${Colors.softOutline};
  height: 100%;
`;

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

const RouteBreadcrumbs = ({ patientRoutes }) => {
  const location = useLocation();

  // Find the matching route based on current location
  const matchedRoute = patientRoutes.find(route => {
    if (route.index) {
      return null;
    }

    const fullPath = `${PATIENT_PATHS.PATIENT}/${route.path}`;
    return matchPath({ path: fullPath, end: true }, location.pathname);
  });

  return matchedRoute?.breadcrumbs || [];
};

export const PatientNavigation = ({ patientRoutes }) => {
  const navigate = useNavigate();
  const navigateBack = () => navigate(-1);
  const routeBreadcrumbs = RouteBreadcrumbs({ patientRoutes });

  return (
    <StickyContainer data-testid="stickycontainer-ju8w">
      <NoteModalActionBlocker isNavigationBlock>
        <BackButton onClick={navigateBack} data-testid="backbutton-1n40" />
      </NoteModalActionBlocker>
      <VerticalDivider data-testid="verticaldivider-yzxo" />
      <StyledBreadcrumbs data-testid="styledbreadcrumbs-68ga">
        <NoteModalActionBlocker isNavigationBlock>
          <CategoryBreadcrumb />
        </NoteModalActionBlocker>
        <PatientBreadcrumb />
        {routeBreadcrumbs}
      </StyledBreadcrumbs>
    </StickyContainer>
  );
};
