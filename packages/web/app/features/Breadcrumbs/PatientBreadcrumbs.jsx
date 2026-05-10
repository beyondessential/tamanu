import React from 'react';
import { useSelector } from 'react-redux';
import { matchPath, useLocation, useParams } from 'react-router';
import styled from 'styled-components';
import { useProgramRegistryQuery } from '../../api/queries';
import {
  getPatientNameAsString,
  TranslatedReferenceData,
  TranslatedText,
  UnstyledHtmlButton,
} from '../../components';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { PATIENT_CATEGORY_LABELS, PATIENT_PATHS } from '../../constants/patientPaths';
import { useEncounter } from '../../contexts/Encounter';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { getEncounterType } from '../../views/patients/panes/EncounterInfoPane';

/** Button semantics (uses `onClick` instead of `href`), but looks like an anchor. */
const AnchorLikeButton = styled(UnstyledHtmlButton)`
  color: ${props => props.theme.palette.primary.main};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export const Breadcrumb = ({ title, ...props }) => (
  <AnchorLikeButton {...props}>{title}</AnchorLikeButton>
);

export const PatientBreadcrumb = props => {
  const patient = useSelector(state => state.patient);
  const { navigateToPatient } = usePatientNavigation();
  const onClick = () => navigateToPatient(patient.id);
  return <Breadcrumb {...props} onClick={onClick} title={getPatientNameAsString(patient || {})} />;
};

export const CategoryBreadcrumb = props => {
  const { navigateToCategory } = usePatientNavigation();
  const params = useParams();
  const onClick = () => navigateToCategory(params.category);
  return (
    <Breadcrumb {...props} onClick={onClick} title={PATIENT_CATEGORY_LABELS[params.category]} />
  );
};

export const ProgramRegistryBreadcrumb = props => {
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
      {...props}
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

export const EncounterBreadcrumb = props => {
  const { encounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  return (
    <Breadcrumb
      {...props}
      onClick={() => navigateToEncounter(encounter.id)}
      title={getEncounterType(encounter || {})}
      key="encounter"
    />
  );
};

export const MedicationBreadcrumb = props => {
  const { encounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  return (
    <Breadcrumb
      {...props}
      onClick={() => navigateToEncounter(encounter?.id, { tab: ENCOUNTER_TAB_NAMES.MEDICATION })}
      title={<TranslatedText stringId="encounter.medication.title" fallback="Medication" />}
    />
  );
};
