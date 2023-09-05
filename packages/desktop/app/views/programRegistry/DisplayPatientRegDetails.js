import React from 'react';
import styled from 'styled-components';
import { Avatar } from '@material-ui/core';
import { Colors, PROGRAM_REGISTRATION_STATUSES } from '../../constants/index';
import { DateDisplay } from '../../components/DateDisplay';
import { programsIcon } from '../../constants/images';
import { GreyOutlinedButton } from '../../components/Button';
import { MenuButton } from '../../components/MenuButton';

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
  justify-content: end;
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
  background-color: #19934e1a;
`;

const ValueDisplay = ({ label, value }) => (
  <LabelValueContainer>
    <div className="label">{label}: </div> <div className="value">{value}</div>
  </LabelValueContainer>
);

export const DisplayPatientRegDetails = ({ patientProgramRegistration }) => {
  const isRemoved =
    patientProgramRegistration.status.code === PROGRAM_REGISTRATION_STATUSES.REMOVED;

  console.log(isRemoved);
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
          value={patientProgramRegistration.addedBy.displayName}
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
        <StatusBadge color="green">{patientProgramRegistration.status.name}</StatusBadge>
        <GreyOutlinedButton>Change Status</GreyOutlinedButton>
      </ChangeStatusContainer>
      <MenuContainer>
        <div className="menu">
          <MenuButton
            actions={
              isRemoved
                ? {
                    Remove: () => {},
                    Delete: () => {},
                  }
                : {
                    Activate: () => {},
                    Delete: () => {},
                  }
            }
          />
        </div>
      </MenuContainer>
    </DisplayContainer>
  );
};
