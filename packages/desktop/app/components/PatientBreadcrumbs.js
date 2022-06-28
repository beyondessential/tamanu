import { Breadcrumbs, Typography } from '@material-ui/core';
import React from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { useEncounter } from '../contexts/Encounter';
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

const getCategoryText = ({ category }) => CATEGORY_TO_TEXT[category];
const getEncounterLabel = ({ encounterType }) => ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label;
const getPatientName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

export const PatientBreadcrumbs = () => {
  const params = useParams();
  const { navigateToCategory, navigateToPatient, navigateToEncounter } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();

  const breadCrumbsMap = [
    { path: '/patients/:category', text: getCategoryText(params), link: navigateToCategory },
    {
      path: '/patients/:category/:patientId/:modal?',
      text: getPatientName(patient),
      link: navigateToPatient,
    },
    [
      {
        path: '/patients/:category/:patientId/programs/new',
        text: 'New Survey',
      },
      {
        path: '/patients/:category/:patientId/referrals/new',
        text: 'New Referral',
      },
      {
        path: '/patients/:category/:patientId/encounter/:encounterId/:modal?',
        text: getEncounterLabel(encounter || {}),
        link: navigateToEncounter,
      },
    ],
    [
      {
        path: '/patients/:category/:patientId/encounter/:encounterId/summary',
        text: 'Discharge Summary',
      },
      {
        path:
          '/patients/:category/:patientId/encounter/:encounterId/lab-requests/:labRequestId/:modal?',
        text: 'Lab Request',
      },
      {
        path:
          '/patients/:category/:patientId/encounter/:encounterId/imaging-requests/:imagingRequestId/:modal?',
        text: 'Imaging Request',
      },
    ],
  ];

  return (
    <StyledBreadcrumbs>
      {breadCrumbsMap.map(crums => {
        const crum = Array.isArray(crums) ? crums.find(x => useRouteMatch(x.path)) : crums;
        if (!crum) return null;
        const { isExact } = useRouteMatch(crum.path);

        return (
          <Breadcrumb onClick={crum.link} active={isExact}>
            {crum.text}
          </Breadcrumb>
        );
      })}
    </StyledBreadcrumbs>
  );
};
