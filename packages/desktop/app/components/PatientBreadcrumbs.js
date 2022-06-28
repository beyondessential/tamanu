import { Breadcrumbs, Typography } from '@material-ui/core';
import React from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { useEncounter } from '../contexts/Encounter';
import { useLabRequest } from '../contexts/LabRequest';
import { usePatientNavigation } from '../utils/usePatientNavigation';

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

const CATEGORY_TO_TEXT = {
  all: 'All Patients',
  emergency: 'Emergency Patients',
  outpatient: 'Outpatients',
  inpatient: 'Inpatients',
};

const Breadcrumb = ({ active, ...props }) =>
  active ? <ActiveBreadcrumb {...props} /> : <InactiveBreadcrumb {...props} />;

const ActiveBreadcrumb = ({ children }) => <BreadcrumbText>{children}</BreadcrumbText>;
const InactiveBreadcrumb = ({ children, onClick }) => (
  <BreadcrumbLink underline="hover" color="inherit" onClick={onClick}>
    {children}
  </BreadcrumbLink>
);

export const PatientBreadcrumbs = () => {
  const params = useParams();
  const { navigateToCategory, navigateToPatient, navigateToEncounter } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  return (
    <StyledBreadcrumbs>
      <Breadcrumb onClick={navigateToCategory}>{CATEGORY_TO_TEXT[params.category]}</Breadcrumb>
      <Breadcrumb onClick={navigateToPatient} active={!params.encounterId}>
        {patient.firstName} {patient.lastName}
      </Breadcrumb>
      {params.encounterId && encounter && (
        <Breadcrumb
          onClick={navigateToEncounter}
          active={!(params.labRequestId || params.imagingRequestId)}
        >
          {ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].label}
        </Breadcrumb>
      )}
      {params.labRequestId && <Breadcrumb active>Lab Request</Breadcrumb>}
      {params.imagingRequestId && <Breadcrumb active>Imaging Request</Breadcrumb>}
    </StyledBreadcrumbs>
  );
};
