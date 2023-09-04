import React from 'react';
import styled from 'styled-components';
import { Avatar } from '@material-ui/core';
import { Colors } from '../../constants/index';
import { DateDisplay } from '../../components/DateDisplay';
import { programsIcon } from '../../constants/images';
import { GreyOutlinedButton } from '../../components/Button';
import { MenuButton } from '../../components/MenuButton';

const DisplayContainer = styled.div`
  display: flex;
  height: 74px;
  width: 797px;
  // width: 100%;
  flex-direction: row;
  justify-content: start;
  align-items: center;
  border: 1px solid ${Colors.softOutline};
  font-size: 11px;
  padding: 10px;
  background-color: ${Colors.white};
  div {
    // border: 1px dotted black;
  }
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
    // height: 28px;
    // width: 28px;
    border-radius: 100px;
    background-color: ${Colors.hoverGrey};
  }
`;

const Statusbadge = styled.div`
  padding: 11px 6px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  height: 20px;
  color: ${props => props.color};
  background-color: #19934e1a;
`;

export const DisplayPatientRegDetails = ({ patientProgramRegistration }) => {
  return (
    <DisplayContainer>
      <LogoContainer>
        <Avatar src={programsIcon} style={{ height: '22px', width: '22px' }} />
      </LogoContainer>
      <LabelContainer>
        <LabelValueContainer>
          <div className="label">Date of registration:</div>
          <div className="value">
            <DateDisplay date={patientProgramRegistration.date} />
          </div>
        </LabelValueContainer>
        <LabelValueContainer>
          <div className="label">Registered by:</div>
          <div className="value">{patientProgramRegistration.addedBy}</div>
        </LabelValueContainer>
      </LabelContainer>
      {patientProgramRegistration.registrationStatus === 'Removed' && (
        <StatusContainer>
          <LabelValueContainer>
            <div className="label">Date removed:</div>
            <div className="value">
              <DateDisplay date={patientProgramRegistration.date} />
            </div>
          </LabelValueContainer>
          <LabelValueContainer>
            <div className="label">Removed by:</div>
            <div className="value">{patientProgramRegistration.removedBy}</div>
          </LabelValueContainer>
        </StatusContainer>
      )}
      <ChangeStatusContainer
        {...(patientProgramRegistration.registrationStatus !== 'Removed' && { extraWidth: true })}
      >
        <Statusbadge color="green">
          {patientProgramRegistration.programRegistryClinicalStatusId}
        </Statusbadge>
        <GreyOutlinedButton>Change Status</GreyOutlinedButton>
      </ChangeStatusContainer>
      <MenuContainer>
        <div className="menu">
          <MenuButton
            actions={
              patientProgramRegistration.registrationStatus !== 'Removed'
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
