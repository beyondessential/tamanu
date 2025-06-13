import { goBack, push } from 'connected-react-router';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Colors } from '../constants';
import { BackButton } from './Button';
import { PatientBreadcrumbs } from './PatientBreadcrumbs';
import { matchPath, useLocation } from 'react-router-dom';
import { PATIENT_PATHS } from '../constants/patientPaths';
import { ENCOUNTER_TAB_NAMES } from '../constants/encounterTabNames';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

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

export const PatientNavigation = ({ patientRoutes }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigateBack = () => {
    const match = matchPath(location.pathname, {
      path: `${PATIENT_PATHS.MAR}/view`,
    });
    if (match?.isExact) {
      const params = match.params;
      dispatch(
        push(
          `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}?tab=${ENCOUNTER_TAB_NAMES.MEDICATION}`,
        ),
      );
    } else {
      dispatch(goBack());
    }
  };

  return (
    <StickyContainer data-testid="stickycontainer-ju8w">
      <NoteModalActionBlocker isNavigationBlock>
        <BackButton onClick={navigateBack} data-testid="backbutton-1n40" />
      </NoteModalActionBlocker>
      <VerticalDivider data-testid="verticaldivider-yzxo" />
      <PatientBreadcrumbs patientRoutes={patientRoutes} data-testid="patientbreadcrumbs-383h" />
    </StickyContainer>
  );
};
