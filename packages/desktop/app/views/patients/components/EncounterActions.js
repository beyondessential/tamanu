import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { DischargeModal } from '../../../components/DischargeModal';
import { ChangeEncounterTypeModal } from '../../../components/ChangeEncounterTypeModal';
import { ChangeDepartmentModal } from '../../../components/ChangeDepartmentModal';
import { ChangeClinicianModal } from '../../../components/ChangeClinicianModal';
import { BeginPatientMoveModal } from './BeginPatientMoveModal';
import { FinalisePatientMoveModal } from './FinalisePatientMoveModal';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { Button, connectRoutedModal } from '../../../components';
import { DropdownButton } from '../../../components/DropdownButton';

const EncounterActionDropdown = ({ encounter }) => {
  const { navigateToEncounter, navigateToSummary } = usePatientNavigation();
  const onChangeEncounterType = type => navigateToEncounter(encounter.id, `changeType`, { type });
  const onDischargeOpen = () => navigateToEncounter(encounter.id, 'discharge');
  const onChangeDepartment = () => navigateToEncounter(encounter.id, 'changeDepartment');
  const onChangeClinician = () => navigateToEncounter(encounter.id, 'changeClinician');
  const onPlanLocationChange = () => navigateToEncounter(encounter.id, 'beginMove');
  const onFinaliseLocationChange = () => navigateToEncounter(encounter.id, 'finaliseMove');
  const onCancelLocationChange = () => navigateToEncounter(encounter.id, 'cancelMove');
  const onViewSummary = () => navigateToSummary();

  if (encounter.endDate) {
    return (
      <Button variant="outlined" color="primary" onClick={onViewSummary}>
        View discharge summary
      </Button>
    );
  }

  const progression = {
    [ENCOUNTER_TYPES.TRIAGE]: 0,
    [ENCOUNTER_TYPES.OBSERVATION]: 1,
    [ENCOUNTER_TYPES.EMERGENCY]: 2,
    [ENCOUNTER_TYPES.ADMISSION]: 3,
  };
  const isProgressionForward = (currentState, nextState) =>
    progression[nextState] > progression[currentState];

  const actions = [
    {
      label: 'Move to active ED care',
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.OBSERVATION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.OBSERVATION),
    },
    {
      label: 'Move to emergency short stay',
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.EMERGENCY),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.EMERGENCY),
    },
    {
      label: 'Admit to hospital',
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.ADMISSION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.ADMISSION),
    },
    {
      label: 'Plan location change',
      condition: () => !encounter.plannedLocation,
      onClick: onPlanLocationChange,
    },
    {
      label: 'Finalise location change',
      // Todo: update condition
      condition: () => !encounter.plannedLocation,
      onClick: onFinaliseLocationChange,
    },
    {
      label: 'Cancel location change',
      // Todo: update condition
      condition: () => !encounter.plannedLocation,
      onClick: onCancelLocationChange,
    },
    {
      label: 'Discharge without being seen',
      onClick: onDischargeOpen,
      condition: () => encounter.encounterType === ENCOUNTER_TYPES.TRIAGE,
    },
    {
      label: 'Discharge',
      onClick: onDischargeOpen,
      condition: () => encounter.encounterType !== ENCOUNTER_TYPES.TRIAGE,
    },
    {
      label: 'Change department',
      onClick: onChangeDepartment,
    },
    {
      label: 'Change clinician',
      onClick: onChangeClinician,
    },
  ].filter(action => !action.condition || action.condition());

  return <DropdownButton variant="outlined" actions={actions} />;
};

const getConnectRoutedModal = ({ category, patientId, encounterId }, suffix) =>
  connectRoutedModal(`/patients/${category}/${patientId}/encounter/${encounterId}`, suffix);

export const EncounterActions = React.memo(({ encounter }) => {
  const params = useParams();

  const RoutedDischargeModal = useMemo(() => getConnectRoutedModal(params, 'discharge'), [params])(
    DischargeModal,
  );

  const RoutedChangeEncounterTypeModal = useMemo(
    () => getConnectRoutedModal(params, 'changeType'),
    [params],
  )(ChangeEncounterTypeModal);

  const RoutedChangeDepartmentModal = useMemo(
    () => getConnectRoutedModal(params, 'changeDepartment'),
    [params],
  )(ChangeDepartmentModal);

  const RoutedChangeClinicianModal = useMemo(
    () => getConnectRoutedModal(params, 'changeClinician'),
    [params],
  )(ChangeClinicianModal);

  const RoutedCancelMoveModal = useMemo(() => getConnectRoutedModal(params, 'cancelMove'), [
    params,
  ])(CancelPatientMoveModal);

  const RoutedBeginMoveModal = useMemo(() => getConnectRoutedModal(params, 'beginMove'), [params])(
    BeginPatientMoveModal,
  );

  const RoutedFinaliseMoveModal = useMemo(() => getConnectRoutedModal(params, 'finaliseMove'), [
    params,
  ])(FinalisePatientMoveModal);

  return (
    <>
      <EncounterActionDropdown encounter={encounter} />
      <RoutedDischargeModal encounter={encounter} />
      <RoutedChangeEncounterTypeModal encounter={encounter} />
      <RoutedChangeDepartmentModal />
      <RoutedChangeClinicianModal />
      <RoutedBeginMoveModal encounter={encounter} />
      <RoutedFinaliseMoveModal encounter={encounter} />
      <RoutedCancelMoveModal encounter={encounter} />
    </>
  );
});
