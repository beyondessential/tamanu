import React, { useState } from 'react';
import styled from 'styled-components';
import { Avatar } from '@material-ui/core';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { Colors } from '../../constants/index';
import { DateDisplay } from '../../components/DateDisplay';
import { programsIcon } from '../../constants/images';
import { MenuButton } from '../../components/MenuButton';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { ActivatePatientProgramRegistry } from './ActivatePatientProgramRegistry';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { OutlinedButton } from '../../components';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { ConditionalTooltip } from '../../components/Tooltip';

const DisplayContainer = styled.div`
  display: flex;
  height: 74px;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border: 1px solid ${Colors.softOutline};
  border-radius: 5px;
  font-size: 11px;
  padding: 10px;
  background-color: ${Colors.white};
`;
const LogoContainer = styled.div`
  width: 5%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  margin-left: 17px;
`;

const DividerVertical = styled.div`
  border-left: 1px solid ${Colors.softOutline};
  height: 44px;
  margin-right: 10px;
`;

const MenuContainer = styled.div`
  width: 10%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-right: 10px;
  .menu {
    border-radius: 100px;
  }
`;

const TextColumnsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  margin-right: 10px;
`;
const TextColumns = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-right: 5px;
  font-weight: 400;
  font-size: 11px;
`;

export const DisplayPatientRegDetails = ({ patientProgramRegistration }) => {
  const { navigateToPatient } = usePatientNavigation();
  const [openChangeStatusFormModal, setOpenChangeStatusFormModal] = useState(false);
  const [openDeleteProgramRegistryFormModal, setOpenDeleteProgramRegistryFormModal] = useState(
    false,
  );
  const [openActivateProgramRegistryFormModal, setOpenActivateProgramRegistryFormModal] = useState(
    false,
  );
  const [openRemoveProgramRegistryFormModal, setOpenRemoveProgramRegistryFormModal] = useState(
    false,
  );

  const isRemoved =
    patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.INACTIVE;
  const isDeleted =
    patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.RECORDED_IN_ERROR;

  let actions = {
    Remove: () => setOpenRemoveProgramRegistryFormModal(true),
    Delete: () => setOpenDeleteProgramRegistryFormModal(true),
  };

  if (isRemoved)
    actions = {
      Activate: () => setOpenActivateProgramRegistryFormModal(true),
      Delete: () => setOpenDeleteProgramRegistryFormModal(true),
    };

  if (isDeleted)
    actions = {
      Activate: () => setOpenActivateProgramRegistryFormModal(true),
      Remove: () => setOpenRemoveProgramRegistryFormModal(true),
    };

  return (
    <DisplayContainer>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <LogoContainer>
          <Avatar src={programsIcon} style={{ height: '22px', width: '22px', margin: '5px' }} />
        </LogoContainer>
        <TextColumnsContainer>
          <TextColumns>
            <div>Date of registration:</div>
            <div>Registered by:</div>
          </TextColumns>
          <TextColumns style={{ fontWeight: 500 }}>
            <DateDisplay date={patientProgramRegistration.registrationDate} />
            <div>{patientProgramRegistration.clinician.displayName}</div>
          </TextColumns>
        </TextColumnsContainer>
        {isRemoved && (
          <>
            <DividerVertical />
            <TextColumnsContainer>
              <TextColumns>
                <div>Date removed:</div>
                <div>Removed by:</div>
              </TextColumns>
              <TextColumns style={{ fontWeight: 500 }}>
                <DateDisplay date={patientProgramRegistration.dateRemoved} />
                <div>{patientProgramRegistration.removedBy?.displayName}</div>
              </TextColumns>
            </TextColumnsContainer>
          </>
        )}

        <DividerVertical />
        <ClinicalStatusDisplay clinicalStatus={patientProgramRegistration.clinicalStatus} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <ConditionalTooltip title="Patient must be active" visible={isRemoved}>
          <OutlinedButton onClick={() => setOpenChangeStatusFormModal(true)} disabled={isRemoved}>
            Change status
          </OutlinedButton>
        </ConditionalTooltip>
        <ChangeStatusFormModal
          patientProgramRegistration={patientProgramRegistration}
          open={openChangeStatusFormModal}
          onClose={() => setOpenChangeStatusFormModal(false)}
        />

        <MenuContainer>
          <div className="menu">
            <MenuButton actions={actions} />
          </div>
        </MenuContainer>
      </div>
      <ActivatePatientProgramRegistry
        open={openActivateProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={() => setOpenActivateProgramRegistryFormModal(false)}
      />
      <RemoveProgramRegistryFormModal
        open={openRemoveProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={() => setOpenRemoveProgramRegistryFormModal(false)}
      />
      <DeleteProgramRegistryFormModal
        open={openDeleteProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={({ success }) => {
          setOpenDeleteProgramRegistryFormModal(false);
          if (success) navigateToPatient(patientProgramRegistration.patientId);
        }}
      />
    </DisplayContainer>
  );
};
