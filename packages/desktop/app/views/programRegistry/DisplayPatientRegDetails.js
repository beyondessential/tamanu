// @ts-check
import React, { useState } from 'react';
import styled from 'styled-components';
import { Avatar } from '@material-ui/core';
import { STATUS_COLOR } from '@tamanu/constants';
import { Colors, PROGRAM_REGISTRATION_STATUSES } from '../../constants/index';
import { DateDisplay } from '../../components/DateDisplay';
import { programsIcon } from '../../constants/images';
import { MenuButton } from '../../components/MenuButton';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { ActivatePatientProgramRegistry } from './ActivatePatientProgramRegistry';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import {
  FormSeparatorVerticalLine,
  RemoveProgramRegistryFormModal,
} from './RemoveProgramRegistryFormModal';
import { OutlinedButton } from '../../components';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';

const DisplayContainer = styled.div`
  display: flex;
  height: 74px;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border: 1px solid ${Colors.softOutline};
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

const StatusBadge = styled.div`
  padding: 11px 6px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  height: 20px;
  color: ${props => props.color};
  background-color: ${props => props.backgroundColor};
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
`;

export const DisplayPatientRegDetails = ({ patientProgramRegistration }) => {
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
    patientProgramRegistration.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED;
  const isDeleted =
    patientProgramRegistration.registrationStatus === PROGRAM_REGISTRATION_STATUSES.DELETED;

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
            <DateDisplay date={patientProgramRegistration.createdAt} />
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
                <DateDisplay date={patientProgramRegistration.date} />
                <div>{patientProgramRegistration.clinician.displayName}</div>
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
        <OutlinedButton
          onClick={() => setOpenChangeStatusFormModal(true)}
          disabled={
            patientProgramRegistration.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED
          }
        >
          Change Status
        </OutlinedButton>
        <ChangeStatusFormModal
          patientProgramRegistration={patientProgramRegistration}
          open={openChangeStatusFormModal}
          onClose={() => setOpenChangeStatusFormModal(false)}
        />

        <MenuContainer>
          <div className="menu">
            <MenuButton
              actions={
                isRemoved || isDeleted
                  ? {
                      Activate: () => setOpenActivateProgramRegistryFormModal(true),
                      Delete: () => setOpenDeleteProgramRegistryFormModal(true),
                    }
                  : {
                      Remove: () => setOpenRemoveProgramRegistryFormModal(true),
                      Delete: () => setOpenDeleteProgramRegistryFormModal(true),
                    }
              }
            />
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
        onClose={() => setOpenDeleteProgramRegistryFormModal(false)}
      />
    </DisplayContainer>
  );
};
