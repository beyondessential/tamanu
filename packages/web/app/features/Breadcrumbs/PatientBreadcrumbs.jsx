import React from 'react';
import { Typography } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { useLocation, useParams, matchPath } from 'react-router';
import styled from 'styled-components';
import { PATIENT_CATEGORY_LABELS, PATIENT_PATHS } from '../../constants/patientPaths';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { getPatientNameAsString, TranslatedText, TranslatedReferenceData } from '../../components';
import { useEncounter } from '../../contexts/Encounter';
import { getEncounterType } from '../../views/patients/panes/EncounterInfoPane';
import { useProgramRegistryQuery } from '../../api/queries';

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

export const PatientBreadcrumb = () => {
  const patient = useSelector(state => state.patient);
  const { navigateToPatient } = usePatientNavigation();
  const onClick = () => navigateToPatient(patient.id);
  return <Breadcrumb onClick={onClick} title={getPatientNameAsString(patient || {})} />;
};

export const CategoryBreadcrumb = () => {
  const { navigateToCategory } = usePatientNavigation();
  const params = useParams();
  const onClick = () => navigateToCategory(params.category);
  return <Breadcrumb onClick={onClick} title={PATIENT_CATEGORY_LABELS[params.category]} />;
};

export const ProgramRegistryBreadcrumb = () => {
  const location = useLocation();
  const { navigateToProgramRegistry } = usePatientNavigation();
  const match = matchPath(
    {
      path: `${PATIENT_PATHS.PROGRAM_REGISTRY}*`,
    },
    location.pathname,
  );
  const programRegistryId = match?.params.programRegistryId;
  const { data: programRegistry } = useProgramRegistryQuery(programRegistryId);

  if (!programRegistry) {
    return null;
  }

  return (
    <Breadcrumb
      onClick={() => navigateToProgramRegistry(programRegistryId)}
      title={
        <TranslatedReferenceData
          fallback={programRegistry.name}
          value={programRegistry.id}
          category="programRegistry"
        />
      }
    />
  );
};

export const EncounterBreadcrumb = () => {
  const { encounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  return (
    <Breadcrumb
      onClick={() => navigateToEncounter(encounter.id)}
      title={getEncounterType(encounter || {})}
      key="encounter"
    />
  );
};

export const MedicationBreadcrumb = () => {
  const { encounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  return (
    <Breadcrumb
      onClick={() => {
        navigateToEncounter(encounter?.id, {
          tab: ENCOUNTER_TAB_NAMES.MEDICATION,
        });
      }}
      title={<TranslatedText stringId="encounter.medication.title" fallback="Medication" />}
    />
  );
};
