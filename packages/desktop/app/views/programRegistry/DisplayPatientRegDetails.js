import React, { useState } from 'react';
import styled from 'styled-components';
import { Avatar } from '@material-ui/core';
import { Colors, STATUS_COLOR, PROGRAM_REGISTRATION_STATUSES } from '../../constants/index';
import { DateDisplay } from '../../components/DateDisplay';
import { programsIcon } from '../../constants/images';
import { MenuButton } from '../../components/MenuButton';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { ActivateProgramRegistryFormModal } from './ActivateProgramRegistryFormModal';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';

const DisplayContainer = styled.div`
  display: flex;
  height: 74px;
  width: 100%;
  flex-direction: row;
  justify-content: start;
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
`;

const LabelValueContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  .label {
    width: 60%;
  }
  .value {
    width: 40%;
  }
`;
const LabelContainer = styled.div`
  width: 25%;
  display: flex;
  flex-direction: column;
`;

const StatusContainer = styled.div`
  width: 25%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid ${Colors.softOutline};
  padding-left: 10px;
`;

const ChangeStatusContainer = styled.div`
  width: ${props => (props.extraWidth ? 35 + 25 : 35)}%;
  display: flex;
  align-items: center;
  flex-direction: row;
  border-left: 1px solid ${Colors.softOutline};
  padding-left: 10px;
  justify-content: space-between;
`;

const MenuContainer = styled.div`
  width: 10%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  justify-content: flex-end;
  .menu {
    border-radius: 100px;
    background-color: ${Colors.hoverGrey};
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

const ValueDisplay = ({ label, value }) => (
  <LabelValueContainer>
    <div className="label">{label}: </div> <div className="value">{value}</div>
  </LabelValueContainer>
);

export const DisplayPatientRegDetails = ({ patientProgramRegistration }) => {
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
  return (
    <DisplayContainer>
      <LogoContainer>
        <Avatar src={programsIcon} style={{ height: '22px', width: '22px' }} />
      </LogoContainer>
      <LabelContainer>
        <ValueDisplay
          label="Date of registration"
          value={<DateDisplay date={patientProgramRegistration.date} />}
        />
        <ValueDisplay
          label="Registered by"
          value={patientProgramRegistration.clinician.displayName}
        />
      </LabelContainer>
      {isRemoved && (
        <StatusContainer>
          <ValueDisplay
            label="Date removed"
            value={<DateDisplay date={patientProgramRegistration.date} />}
          />
          <ValueDisplay
            label="Removed by"
            value={patientProgramRegistration.removedBy.displayName}
          />
        </StatusContainer>
      )}
      <ChangeStatusContainer extraWidth={!isRemoved}>
        <StatusBadge
          color={STATUS_COLOR[patientProgramRegistration.programRegistryClinicalStatus.color].color}
          backgroundColor={
            STATUS_COLOR[patientProgramRegistration.programRegistryClinicalStatus.color].background
          }
        >
          {patientProgramRegistration.programRegistryClinicalStatus.name}
        </StatusBadge>

        <ChangeStatusFormModal patientProgramRegistration={patientProgramRegistration} />
      </ChangeStatusContainer>
      <MenuContainer>
        <div className="menu">
          <MenuButton
            actions={
              isRemoved
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
      <ActivateProgramRegistryFormModal
        open={openActivateProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onSubmit={() => {
          setOpenActivateProgramRegistryFormModal(false);
        }}
        onCancel={() => {
          // console.log('canceled');
          setOpenActivateProgramRegistryFormModal(false);
        }}
      />
      <RemoveProgramRegistryFormModal
        open={openRemoveProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onSubmit={() => {
          setOpenRemoveProgramRegistryFormModal(false);
        }}
        onCancel={() => {
          // console.log('canceled');
          setOpenRemoveProgramRegistryFormModal(false);
        }}
      />
      <DeleteProgramRegistryFormModal
        open={openDeleteProgramRegistryFormModal}
        programRegistry={patientProgramRegistration}
        onSubmit={() => {
          setOpenDeleteProgramRegistryFormModal(false);
        }}
        onCancel={() => {
          // console.log('canceled');
          setOpenDeleteProgramRegistryFormModal(false);
        }}
      />
    </DisplayContainer>
  );
};
